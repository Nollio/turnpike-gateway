// Cost per 1K tokens (input/output) in USD
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-4": { input: 0.03, output: 0.06 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "o1": { input: 0.015, output: 0.06 },
  "o1-mini": { input: 0.003, output: 0.012 },
  "o3-mini": { input: 0.0011, output: 0.0044 },
  // Anthropic
  "claude-opus-4-6": { input: 0.015, output: 0.075 },
  "claude-sonnet-4-6": { input: 0.003, output: 0.015 },
  "claude-haiku-4-5-20251001": { input: 0.0008, output: 0.004 },
};

export const PLANS = {
  starter: {
    name: "Starter",
    priceMonthly: 9900, // cents
    managedSpendLimit: 500000, // $5,000 in cents
    features: ["Up to $5K managed spend", "1 team", "Basic dashboard"],
  },
  pro: {
    name: "Pro",
    priceMonthly: 29900, // cents
    managedSpendLimit: 2500000, // $25,000 in cents
    features: [
      "Up to $25K managed spend",
      "Unlimited teams",
      "Prompt caching",
      "Budget alerts",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
