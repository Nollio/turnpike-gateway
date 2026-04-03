import Link from "next/link";
import { PLANS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <span className="font-semibold text-lg">AI Gateway</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-3xl text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Stop guessing your{" "}
            <span className="text-accent-light">AI API costs</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            One proxy to route, monitor, and optimize all your AI API calls.
            Support for OpenAI and Anthropic with real-time cost tracking.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/dashboard"
              className="bg-accent hover:bg-accent-light text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Start Free Trial
            </Link>
            <a
              href="#pricing"
              className="border border-border hover:border-muted text-foreground px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full">
          {[
            {
              title: "Unified Proxy",
              desc: "Route all AI API calls through one endpoint. Drop-in replacement for OpenAI and Anthropic SDKs.",
            },
            {
              title: "Cost Intelligence",
              desc: "Real-time dashboards showing spend by model, API key, and time period. Know exactly where your money goes.",
            },
            {
              title: "API Key Management",
              desc: "Create scoped gateway keys per team or project. Track usage per key with full audit trail.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div id="pricing" className="mt-24 max-w-4xl w-full">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(Object.entries(PLANS) as [string, (typeof PLANS)[keyof typeof PLANS]][]).map(
              ([key, plan]) => (
                <div
                  key={key}
                  className={`bg-card border rounded-xl p-8 space-y-6 ${
                    key === "pro" ? "border-accent" : "border-border"
                  }`}
                >
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">
                        ${plan.priceMonthly / 100}
                      </span>
                      <span className="text-muted">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted">
                        <span className="text-success">&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={`block text-center py-3 rounded-lg font-medium transition-colors ${
                      key === "pro"
                        ? "bg-accent hover:bg-accent-light text-white"
                        : "border border-border hover:border-muted text-foreground"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted">
        AI Gateway &mdash; Cost intelligence for AI APIs
      </footer>
    </div>
  );
}
