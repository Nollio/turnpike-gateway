import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/lib/db";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  const sql = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan;
      if (orgId && plan) {
        await sql`
          UPDATE organizations
          SET plan = ${plan},
              stripe_subscription_id = ${session.subscription as string},
              updated_at = now()
          WHERE id = ${orgId}
        `;
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      if (subscription.status === "active") {
        await sql`
          UPDATE organizations
          SET stripe_subscription_id = ${subscription.id},
              updated_at = now()
          WHERE stripe_customer_id = ${customerId}
        `;
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await sql`
        UPDATE organizations
        SET plan = 'starter',
            stripe_subscription_id = NULL,
            updated_at = now()
        WHERE stripe_subscription_id = ${subscription.id}
      `;
      break;
    }
  }

  return NextResponse.json({ received: true });
}
