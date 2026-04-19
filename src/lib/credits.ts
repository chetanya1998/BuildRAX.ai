import { CreditBalance, CreditPolicy } from "@/lib/graph/types";
import { CreditLedgerEntry } from "@/lib/models/CreditLedgerEntry";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";
import dbConnect from "@/lib/mongodb";

const ACTIVE_CREDIT_POLICY: CreditPolicy = {
  promptCompile: 1,
  templateInstantiate: 1,
  simulate: 1,
  execute: 1,
  benchmarkVariant: 1,
};

const DISABLED_CREDIT_POLICY: CreditPolicy = {
  promptCompile: 0,
  templateInstantiate: 0,
  simulate: 0,
  execute: 0,
  benchmarkVariant: 0,
};

// Credit enforcement is intentionally disabled while BuildRAX is being shaped into
// a real product. Set ENABLE_CREDIT_SYSTEM=true to restore metering and ledger debits.
export const CREDIT_SYSTEM_ENABLED = process.env.ENABLE_CREDIT_SYSTEM === "true";

export const CREDIT_POLICY: CreditPolicy = CREDIT_SYSTEM_ENABLED
  ? ACTIVE_CREDIT_POLICY
  : DISABLED_CREDIT_POLICY;

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

function getLedgerUserIds(userId: string) {
  const ids = new Set([userId]);

  if (/^[a-f0-9]{6,}$/i.test(userId)) {
    ids.add(`guest-${userId.slice(0, 6).toLowerCase()}@buildrax.sandbox`);
  }

  if (/^guest-[a-f0-9]{6}@buildrax\.sandbox$/i.test(userId)) {
    ids.add(userId.toLowerCase());
  }

  return Array.from(ids);
}

function getNumberFromAggregate(result: Array<{ total?: number }>) {
  return result[0]?.total || 0;
}

function getDisabledCreditBalance(): CreditBalance {
  return {
    plan: "enterprise",
    availableCredits: 0,
    monthlyLimit: 0,
    monthlyRemaining: 0,
    disabled: true,
    label: "Unmetered preview",
  };
}

export async function getUserCreditBalance(userId: string): Promise<CreditBalance> {
  if (!CREDIT_SYSTEM_ENABLED) {
    return getDisabledCreditBalance();
  }

  await dbConnect();

  const ledgerUserIds = getLedgerUserIds(userId);
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

  const [monthlyDebits, dailyDebits, monthlyCredits] = await Promise.all([
    CreditLedgerEntry.aggregate([
      {
        $match: {
          userId: { $in: ledgerUserIds },
          direction: "debit",
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CreditLedgerEntry.aggregate([
      {
        $match: {
          userId: { $in: ledgerUserIds },
          direction: "debit",
          createdAt: { $gte: dayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CreditLedgerEntry.aggregate([
      {
        $match: {
          userId: { $in: ledgerUserIds },
          direction: "credit",
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const monthUsed = getNumberFromAggregate(monthlyDebits);
  const dayUsed = getNumberFromAggregate(dailyDebits);
  const monthGranted = getNumberFromAggregate(monthlyCredits);

  if (plan === "free") {
    const monthlyLimit = PLAN_LIMITS.free.monthly + monthGranted;
    const planMonthlyRemaining = Math.max(0, PLAN_LIMITS.free.monthly - monthUsed);
    const debitsBeyondPlan = Math.max(0, monthUsed - PLAN_LIMITS.free.monthly);
    const grantedRemaining = Math.max(0, monthGranted - debitsBeyondPlan);
    const monthlyRemaining = Math.max(0, monthlyLimit - monthUsed);
    const dailyRemaining = Math.max(0, PLAN_LIMITS.free.daily - dayUsed);
    return {
      plan,
      availableCredits: Math.min(planMonthlyRemaining, dailyRemaining) + grantedRemaining,
      monthlyLimit,
      monthlyRemaining,
      dailyRemaining,
    };
  }

  const monthlyLimit =
    (subscription?.monthlyCredits || PLAN_LIMITS[plan].monthly) + monthGranted;
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
  if (!CREDIT_SYSTEM_ENABLED) {
    return getDisabledCreditBalance();
  }

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
