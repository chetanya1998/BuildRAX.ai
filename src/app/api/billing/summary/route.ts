import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { getUserCreditBalance } from "@/lib/credits";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";
import { BILLING_PLAN_ORDER, BILLING_PLANS, BillingTier } from "@/lib/billing/plans";

type SessionUser = { id?: string };

function toPlanList() {
  return BILLING_PLAN_ORDER.map((tier) => BILLING_PLANS[tier]);
}

function getRecommendedUpgradeTier(currentPlan: BillingTier): BillingTier | null {
  if (currentPlan === "free") return "pro_20";
  if (currentPlan === "pro_20") return "growth_40";
  if (currentPlan === "growth_40") return "enterprise";
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const plans = toPlanList();

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        plans,
        currentPlan: "free",
        recommendedUpgradeTier: "pro_20",
        subscription: null,
        credits: null,
      });
    }

    const userId = String((session.user as SessionUser).id || "");
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        plans,
        currentPlan: "free",
        recommendedUpgradeTier: "pro_20",
        subscription: null,
        credits: null,
      });
    }

    await dbConnect();

    const [subscription, credits] = await Promise.all([
      SubscriptionPlan.findOne({ userId }).sort({ updatedAt: -1 }).lean(),
      getUserCreditBalance(userId),
    ]);

    const currentPlan = credits.plan;

    return NextResponse.json({
      authenticated: true,
      plans,
      currentPlan,
      recommendedUpgradeTier: getRecommendedUpgradeTier(currentPlan),
      subscription: subscription
        ? {
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart || null,
            currentPeriodEnd: subscription.currentPeriodEnd || null,
            updatedAt: subscription.updatedAt || null,
          }
        : null,
      credits,
    });
  } catch (error) {
    console.error("Billing summary error:", error);
    return NextResponse.json({ error: "Failed to load billing summary" }, { status: 500 });
  }
}
