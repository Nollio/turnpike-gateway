import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PLANS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header" }, { status: 400 });
  }

  const sql = getDb();

  // Get org and plan
  const orgs = await sql`SELECT * FROM organizations WHERE id = ${orgId}`;
  if (orgs.length === 0) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const org = orgs[0];
  const plan = org.plan as keyof typeof PLANS;
  const planConfig = PLANS[plan] ?? PLANS.starter;

  // Get current month spend
  const spend = await sql`
    SELECT COALESCE(SUM(cost_cents), 0)::numeric as total_cost_cents
    FROM usage_logs
    WHERE org_id = ${orgId}
      AND created_at >= date_trunc('month', now())
  `;

  const currentSpendCents = Number(spend[0].total_cost_cents);
  const limitCents = planConfig.managedSpendLimit;
  const usagePercent = limitCents > 0 ? Math.round((currentSpendCents / limitCents) * 100) : 0;

  const alerts: string[] = [];
  if (usagePercent >= 100) {
    alerts.push("spend_limit_exceeded");
  } else if (usagePercent >= 90) {
    alerts.push("spend_limit_90_percent");
  } else if (usagePercent >= 75) {
    alerts.push("spend_limit_75_percent");
  }

  return NextResponse.json({
    orgId,
    plan,
    currentSpendCents,
    limitCents,
    usagePercent,
    alerts,
    period: "current_month",
  });
}
