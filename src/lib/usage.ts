import { getDb } from "./db";
import { MODEL_COSTS } from "./constants";

interface UsageEntry {
  orgId: string;
  apiKeyId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  statusCode: number;
  errorMessage?: string;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  if (!costs) return 0;
  // Cost in cents: (tokens / 1000) * costPer1K * 100
  const inputCost = (inputTokens / 1000) * costs.input * 100;
  const outputCost = (outputTokens / 1000) * costs.output * 100;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

export async function logUsage(entry: UsageEntry): Promise<void> {
  const costCents = calculateCost(
    entry.model,
    entry.inputTokens,
    entry.outputTokens
  );

  const sql = getDb();
  await sql`
    INSERT INTO usage_logs (org_id, api_key_id, provider, model, input_tokens, output_tokens, cost_cents, latency_ms, status_code, error_message)
    VALUES (${entry.orgId}, ${entry.apiKeyId}, ${entry.provider}, ${entry.model}, ${entry.inputTokens}, ${entry.outputTokens}, ${costCents}, ${entry.latencyMs}, ${entry.statusCode}, ${entry.errorMessage ?? null})
  `;
}
