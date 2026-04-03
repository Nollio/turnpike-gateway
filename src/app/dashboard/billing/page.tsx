"use client";

import { PLANS } from "@/lib/constants";

export default function BillingPage() {
  const currentPlan = "starter"; // TODO: fetch from org

  async function handleUpgrade(plan: string) {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": "demo",
      },
      body: JSON.stringify({ plan }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      }
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-sm text-muted mb-1">Current Plan</div>
        <div className="text-xl font-semibold capitalize">{currentPlan}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.entries(PLANS) as [string, (typeof PLANS)[keyof typeof PLANS]][]).map(
          ([key, plan]) => (
            <div
              key={key}
              className={`bg-card border rounded-xl p-6 space-y-4 ${
                key === currentPlan ? "border-accent" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {key === currentPlan && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <div>
                <span className="text-3xl font-bold">${plan.priceMonthly / 100}</span>
                <span className="text-muted">/month</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <span className="text-success">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              {key !== currentPlan && (
                <button
                  onClick={() => handleUpgrade(key)}
                  className="w-full bg-accent hover:bg-accent-light text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
