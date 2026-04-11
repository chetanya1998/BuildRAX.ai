import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BILLING_PLANS, BillingTier } from "@/lib/billing/plans";

const PLAN_CONFIG = {
  pro_20: {
    checkoutUrl: process.env.STRIPE_PRICE_20_CHECKOUT_URL,
  },
  growth_40: {
    checkoutUrl: process.env.STRIPE_PRICE_40_CHECKOUT_URL,
  },
  enterprise: {
    checkoutUrl: process.env.ENTERPRISE_CONTACT_URL,
  },
} as const;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in with GitHub or Google to manage billing." },
        { status: 401 }
      );
    }

    const { tier } = (await req.json()) as { tier?: BillingTier };
    const plan = tier ? PLAN_CONFIG[tier as keyof typeof PLAN_CONFIG] : null;

    if (!tier || !plan) {
      return NextResponse.json({ error: "Unknown billing tier" }, { status: 400 });
    }

    if (!plan.checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout URL is not configured for this plan" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      tier,
      checkoutUrl: plan.checkoutUrl,
      monthlyCredits: BILLING_PLANS[tier].monthlyCredits,
    });
  } catch (error) {
    console.error("Billing checkout error:", error);
    return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
  }
}
