import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { logUsage } from "@/lib/usage";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const start = Date.now();

  const auth = await authenticateRequest(request.headers.get("authorization"));
  if (!auth) {
    return NextResponse.json(
      { error: { message: "Invalid API key", type: "authentication_error" } },
      { status: 401 }
    );
  }

  if (auth.provider !== "openai") {
    return NextResponse.json(
      {
        error: {
          message: "This API key is configured for " + auth.provider + ", not OpenAI. Use the correct endpoint.",
          type: "invalid_request_error",
        },
      },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body", type: "invalid_request_error" } },
      { status: 400 }
    );
  }

  const model = (body.model as string) || "gpt-4o";
  const stream = body.stream === true;

  try {
    const upstreamResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.upstreamKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    const latencyMs = Date.now() - start;

    if (stream && upstreamResponse.ok && upstreamResponse.body) {
      // For streaming, we tee the stream to log usage after completion
      const [logStream, responseStream] = upstreamResponse.body.tee();

      // Log usage asynchronously from the teed stream
      collectStreamUsage(logStream, {
        orgId: auth.orgId,
        apiKeyId: auth.apiKeyId,
        provider: "openai",
        model,
        latencyMs,
      });

      return new Response(responseStream, {
        status: upstreamResponse.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const responseBody = await upstreamResponse.json();
    const latencyFinal = Date.now() - start;

    const inputTokens = responseBody.usage?.prompt_tokens ?? 0;
    const outputTokens = responseBody.usage?.completion_tokens ?? 0;

    // Log usage (fire and forget)
    logUsage({
      orgId: auth.orgId,
      apiKeyId: auth.apiKeyId,
      provider: "openai",
      model,
      inputTokens,
      outputTokens,
      latencyMs: latencyFinal,
      statusCode: upstreamResponse.status,
      errorMessage: upstreamResponse.ok ? undefined : JSON.stringify(responseBody.error),
    }).catch(() => {});

    return NextResponse.json(responseBody, { status: upstreamResponse.status });
  } catch (err) {
    const latencyMs = Date.now() - start;
    logUsage({
      orgId: auth.orgId,
      apiKeyId: auth.apiKeyId,
      provider: "openai",
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      statusCode: 502,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    }).catch(() => {});

    return NextResponse.json(
      { error: { message: "Upstream provider error", type: "api_error" } },
      { status: 502 }
    );
  }
}

async function collectStreamUsage(
  stream: ReadableStream<Uint8Array>,
  meta: {
    orgId: string;
    apiKeyId: string;
    provider: string;
    model: string;
    latencyMs: number;
  }
) {
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.usage) {
            inputTokens = parsed.usage.prompt_tokens ?? inputTokens;
            outputTokens = parsed.usage.completion_tokens ?? outputTokens;
          }
        } catch {
          // skip non-JSON lines
        }
      }
    }

    await logUsage({
      ...meta,
      inputTokens,
      outputTokens,
      statusCode: 200,
    });
  } catch {
    // Best effort logging
  }
}
