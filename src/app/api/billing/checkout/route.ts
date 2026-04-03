import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id" }, { status: 400 });
  }

  const body = await request.json();
  const plan = body.plan as string;

  if (!["starter", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const sql = getDb();
  const orgs = await sql`SELECT * FROM organizations WHERE id = ${orgId}`;
  if (orgs.length === 0) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const org = orgs[0];

  // Get or create Stripe customer
  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.email,
      metadata: { orgId },
    });
    customerId = customer.id;
    await sql`UPDATE organizations SET stripe_customer_id = ${customerId} WHERE id = ${orgId}`;
  }

  const priceId =
    plan === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID!
      : process.env.STRIPE_STARTER_PRICE_ID!;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    metadata: { orgId, plan },
  });

  return NextResponse.json({ url: session.url });
}
