import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";
  const _groupBy = searchParams.get("group_by") || "model";

  const days = period === "7d" ? 7 : period === "24h" ? 1 : 30;

  const sql = getDb();

  // Summary stats
  const summary = await sql`
    SELECT
      COUNT(*)::int as total_requests,
      COALESCE(SUM(input_tokens), 0)::int as total_input_tokens,
      COALESCE(SUM(output_tokens), 0)::int as total_output_tokens,
      COALESCE(SUM(cost_cents), 0)::numeric as total_cost_cents,
      COALESCE(AVG(latency_ms), 0)::int as avg_latency_ms
    FROM usage_logs
    WHERE org_id = ${orgId}
      AND created_at >= now() - make_interval(days => ${days})
  `;

  // By model
  const byModel = await sql`
    SELECT
      model,
      provider,
      COUNT(*)::int as requests,
      COALESCE(SUM(input_tokens), 0)::int as input_tokens,
      COALESCE(SUM(output_tokens), 0)::int as output_tokens,
      COALESCE(SUM(cost_cents), 0)::numeric as cost_cents,
      COALESCE(AVG(latency_ms), 0)::int as avg_latency_ms
    FROM usage_logs
    WHERE org_id = ${orgId}
      AND created_at >= now() - make_interval(days => ${days})
    GROUP BY model, provider
    ORDER BY cost_cents DESC
  `;

  // By API key
  const byKey = await sql`
    SELECT
      ak.name as key_name,
      ak.key_prefix,
      COUNT(*)::int as requests,
      COALESCE(SUM(ul.cost_cents), 0)::numeric as cost_cents
    FROM usage_logs ul
    JOIN api_keys ak ON ak.id = ul.api_key_id
    WHERE ul.org_id = ${orgId}
      AND ul.created_at >= now() - make_interval(days => ${days})
    GROUP BY ak.id, ak.name, ak.key_prefix
    ORDER BY cost_cents DESC
  `;

  // Daily trend
  const daily = await sql`
    SELECT
      DATE(created_at) as date,
      COUNT(*)::int as requests,
      COALESCE(SUM(cost_cents), 0)::numeric as cost_cents
    FROM usage_logs
    WHERE org_id = ${orgId}
      AND created_at >= now() - make_interval(days => ${days})
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return NextResponse.json({
    period,
    summary: summary[0],
    byModel,
    byKey,
    daily,
  });
}
