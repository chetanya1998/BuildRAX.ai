import { CreditBalance, CreditPolicy } from "@/lib/graph/types";
import { CreditLedgerEntry } from "@/lib/models/CreditLedgerEntry";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";
import dbConnect from "@/lib/mongodb";

export const CREDIT_POLICY: CreditPolicy = {
  promptCompile: 1,
  templateInstantiate: 1,
  simulate: 1,
  execute: 1,
  benchmarkVariant: 1,
};

export const PLAN_LIMITS = {
  free: { monthly: 25, daily: 5 },
  pro_20: { monthly: 100 },
  growth_40: { monthly: 250 },
  enterprise: { monthly: 1000 },
} as const;

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function getUserCreditBalance(userId: string): Promise<CreditBalance> {
  await dbConnect();

  const subscription = await SubscriptionPlan.findOne({
    userId,
    status: "active",
  })
    .sort({ updatedAt: -1 })
    .lean();

  const plan =
    (subscription?.tier as CreditBalance["plan"] | undefined) || "free";

  const monthStart = startOfUtcMonth();
  const dayStart = startOfUtcDay();

  const [monthlyDebits, dailyDebits] = await Promise.all([
    CreditLedgerEntry.aggregate([
      {
        $match: {
          userId,
          direction: "debit",
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CreditLedgerEntry.aggregate([
      {
        $match: {
          userId,
          direction: "debit",
          createdAt: { $gte: dayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const monthUsed = monthlyDebits[0]?.total || 0;
  const dayUsed = dailyDebits[0]?.total || 0;

  if (plan === "free") {
    const monthlyRemaining = Math.max(0, PLAN_LIMITS.free.monthly - monthUsed);
    const dailyRemaining = Math.max(0, PLAN_LIMITS.free.daily - dayUsed);
    return {
      plan,
      availableCredits: Math.min(monthlyRemaining, dailyRemaining),
      monthlyLimit: PLAN_LIMITS.free.monthly,
      monthlyRemaining,
      dailyRemaining,
    };
  }

  const monthlyLimit =
    subscription?.monthlyCredits || PLAN_LIMITS[plan].monthly;
  const monthlyRemaining = Math.max(0, monthlyLimit - monthUsed);
  return {
    plan,
    availableCredits: monthlyRemaining,
    monthlyLimit,
    monthlyRemaining,
  };
}

export async function consumeCredits(args: {
  userId: string;
  action: string;
  amount: number;
  referenceType: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}) {
  await dbConnect();

  const balance = await getUserCreditBalance(args.userId);
  if (balance.availableCredits < args.amount) {
    throw new Error("Insufficient credits");
  }

  await CreditLedgerEntry.create({
    userId: args.userId,
    direction: "debit",
    action: args.action,
    amount: args.amount,
    referenceType: args.referenceType,
    referenceId: args.referenceId || "",
    metadata: args.metadata || {},
  });

  return getUserCreditBalance(args.userId);
}
