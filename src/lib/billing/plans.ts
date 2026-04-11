export type BillingTier = "free" | "pro_20" | "growth_40" | "enterprise";

export interface BillingPlanDefinition {
  tier: BillingTier;
  name: string;
  monthlyPriceUsd: number | null;
  monthlyCredits: number;
  monthlyCap: number | null;
  dailyCap: number | null;
  description: string;
  features: string[];
}

export const BILLING_PLAN_ORDER: BillingTier[] = [
  "free",
  "pro_20",
  "growth_40",
  "enterprise",
];

export const BILLING_PLANS: Record<BillingTier, BillingPlanDefinition> = {
  free: {
    tier: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    monthlyCredits: 25,
    monthlyCap: 25,
    dailyCap: 5,
    description:
      "Ideal for local exploration and early architecture design with strict daily/monthly caps.",
    features: [
      "5 credits/day",
      "25 credits/month max",
      "Prompt compile, template instantiate, simulation and benchmark support",
    ],
  },
  pro_20: {
    tier: "pro_20",
    name: "Pro $20",
    monthlyPriceUsd: 20,
    monthlyCredits: 100,
    monthlyCap: 100,
    dailyCap: null,
    description:
      "For individual builders running production-ready design and simulation loops regularly.",
    features: [
      "100 credits/month",
      "No daily cap",
      "Priority usage for compile/simulate/benchmark jobs",
    ],
  },
  growth_40: {
    tier: "growth_40",
    name: "Growth $40",
    monthlyPriceUsd: 40,
    monthlyCredits: 250,
    monthlyCap: 250,
    dailyCap: null,
    description:
      "For teams iterating heavily on AI + backend systems, reliability scenarios, and A/B tests.",
    features: [
      "250 credits/month",
      "No daily cap",
      "Best fit for frequent benchmarking and simulation runs",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPriceUsd: null,
    monthlyCredits: 1000,
    monthlyCap: null,
    dailyCap: null,
    description:
      "Org-level credit pools, governance, and advanced controls with quote-based plans.",
    features: [
      "Custom organization credit pool",
      "SSO-ready integration path",
      "Custom limits, controls, and support",
    ],
  },
};
