import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { logUsage } from "@/lib/usage";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const start = Date.now();

  const auth = await authenticateRequest(
    request.headers.get("x-api-key")
      ? `Bearer ${request.headers.get("x-api-key")}`
      : request.headers.get("authorization")
  );
  if (!auth) {
    return NextResponse.json(
      { type: "error", error: { type: "authentication_error", message: "Invalid API key" } },
      { status: 401 }
    );
  }

  if (auth.provider !== "anthropic") {
    return NextResponse.json(
      {
        type: "error",
        error: {
          type: "invalid_request_error",
          message: "This API key is configured for " + auth.provider + ", not Anthropic. Use the correct endpoint.",
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
      { type: "error", error: { type: "invalid_request_error", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const model = (body.model as string) || "claude-sonnet-4-6";
  const stream = body.stream === true;

  try {
    const upstreamResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": auth.upstreamKey,
        "anthropic-version": (request.headers.get("anthropic-version") as string) || "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - start;

    if (stream && upstreamResponse.ok && upstreamResponse.body) {
      const [logStream, responseStream] = upstreamResponse.body.tee();

      collectAnthropicStreamUsage(logStream, {
        orgId: auth.orgId,
        apiKeyId: auth.apiKeyId,
        provider: "anthropic",
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

    const inputTokens = responseBody.usage?.input_tokens ?? 0;
    const outputTokens = responseBody.usage?.output_tokens ?? 0;

    logUsage({
      orgId: auth.orgId,
      apiKeyId: auth.apiKeyId,
      provider: "anthropic",
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
      provider: "anthropic",
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      statusCode: 502,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    }).catch(() => {});

    return NextResponse.json(
      { type: "error", error: { type: "api_error", message: "Upstream provider error" } },
      { status: 502 }
    );
  }
}

async function collectAnthropicStreamUsage(
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
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "message_start" && parsed.message?.usage) {
            inputTokens = parsed.message.usage.input_tokens ?? 0;
          }
          if (parsed.type === "message_delta" && parsed.usage) {
            outputTokens = parsed.usage.output_tokens ?? 0;
          }
        } catch {
          // skip
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
    // Best effort
  }
}
