import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PLAN_CONFIG = {
  pro_20: {
    checkoutUrl: process.env.STRIPE_PRICE_20_CHECKOUT_URL,
    monthlyCredits: 100,
  },
  growth_40: {
    checkoutUrl: process.env.STRIPE_PRICE_40_CHECKOUT_URL,
    monthlyCredits: 250,
  },
  enterprise: {
    checkoutUrl: process.env.ENTERPRISE_CONTACT_URL,
    monthlyCredits: 1000,
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

    const { tier } = await req.json();
    const plan = PLAN_CONFIG[tier as keyof typeof PLAN_CONFIG];

    if (!plan) {
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
      monthlyCredits: plan.monthlyCredits,
    });
  } catch (error) {
    console.error("Billing checkout error:", error);
    return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
  }
}
