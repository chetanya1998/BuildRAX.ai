"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import useSWR from "swr";
import { Coins, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingPlanDefinition, BillingTier } from "@/lib/billing/plans";
import { CreditBalance } from "@/lib/graph/types";

interface BillingSubscriptionSnapshot {
  tier: BillingTier;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string | null;
}

interface BillingSummaryResponse {
  authenticated: boolean;
  plans: BillingPlanDefinition[];
  currentPlan: BillingTier;
  recommendedUpgradeTier: BillingTier | null;
  subscription: BillingSubscriptionSnapshot | null;
  credits: CreditBalance | null;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to load data");
  }
  return response.json();
};

function formatPrice(plan: BillingPlanDefinition) {
  if (plan.monthlyPriceUsd === null) return "Custom";
  if (plan.monthlyPriceUsd === 0) return "Free";
  return `$${plan.monthlyPriceUsd}/mo`;
}

function formatPeriodDate(dateValue: string | null) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

export default function BillingPage() {
  const [checkoutTier, setCheckoutTier] = useState<BillingTier | null>(null);
  const { data, error, isLoading, mutate } = useSWR<BillingSummaryResponse>(
    "/api/billing/summary",
    fetcher
  );

  const credits = data?.credits || null;
  const monthlyProgress = useMemo(() => {
    if (!credits?.monthlyLimit) return 0;
    const used = Math.max(0, credits.monthlyLimit - credits.monthlyRemaining);
    return Math.min(100, Math.round((used / credits.monthlyLimit) * 100));
  }, [credits]);

  const handleCheckout = async (tier: BillingTier) => {
    if (tier === "free") {
      toast.message("Free plan is active by default. Paid-plan downgrades can be managed via support.");
      return;
    }

    if (!data?.authenticated) {
      await signIn(undefined, { callbackUrl: "/billing" });
      return;
    }

    try {
      setCheckoutTier(tier);

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        toast.error("Sign in with GitHub or Google to continue.");
        await signIn(undefined, { callbackUrl: "/billing" });
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error || "Failed to initialize checkout");
      }

      if (!payload.checkoutUrl) {
        throw new Error("Checkout URL is not configured for this plan");
      }

      window.location.href = payload.checkoutUrl as string;
    } catch (checkoutError) {
      console.error("Checkout error:", checkoutError);
      toast.error(checkoutError instanceof Error ? checkoutError.message : "Checkout failed");
    } finally {
      setCheckoutTier(null);
      mutate();
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-10">
        <Skeleton className="h-40 w-full rounded-3xl bg-card/40" />
        <Skeleton className="h-40 w-full rounded-2xl bg-card/30" />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`plan-skeleton-${index}`} className="h-[340px] rounded-2xl bg-card/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto pb-10">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
            <CardTitle>Unable to load billing details</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-10">
      {/* Compact page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Billing & Credits</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Credits Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Credits gate runtime operations. Static analysis and local/cloud autosave are always free.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Current Entitlements</h2>
          <span className="text-xs text-muted-foreground ml-1">
            {data?.authenticated
              ? "— usage and limits for the active account"
              : "— sign in to unlock billing & usage tracking"}
          </span>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
              <p className="text-2xl font-bold mt-1">{data?.currentPlan || "free"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Credits</p>
              <p className="text-2xl font-bold mt-1">{credits?.availableCredits ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Remaining</p>
              <p className="text-2xl font-bold mt-1">{credits?.monthlyRemaining ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Remaining</p>
              <p className="text-2xl font-bold mt-1">{credits?.dailyRemaining ?? "No cap"}</p>
            </div>
          </div>

          {credits ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Monthly credit usage</span>
                <span>
                  {Math.max(0, credits.monthlyLimit - credits.monthlyRemaining)} / {credits.monthlyLimit}
                </span>
              </div>
              <Progress value={monthlyProgress} className="h-2 bg-secondary/40" />
            </div>
          ) : null}

          {data?.subscription ? (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
              <span>Status: {data.subscription.status}</span>
              <span>Cycle Start: {formatPeriodDate(data.subscription.currentPeriodStart)}</span>
              <span>Cycle End: {formatPeriodDate(data.subscription.currentPeriodEnd)}</span>
            </div>
          ) : null}

          {!data?.authenticated ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Cloud billing requires sign-in</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Authenticate once to save projects, benchmark runs, and billing history to your account.
                </p>
              </div>
              <Button className="rounded-xl" onClick={() => signIn(undefined, { callbackUrl: "/billing" })}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">Pricing Plans</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {(data?.plans || []).map((plan) => {
            const isCurrent = data?.currentPlan === plan.tier;
            const isRecommended = data?.recommendedUpgradeTier === plan.tier;
            const isBusy = checkoutTier === plan.tier;
            const isDowngradeFree = plan.tier === "free" && !isCurrent;
            const buttonDisabled = isCurrent || isBusy || isDowngradeFree;

            return (
              <Card
                key={plan.tier}
                className={`rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_rgba(80,104,255,0.2)]"
                    : "border-border/40 bg-card/20 hover:border-primary/25"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent ? (
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="min-h-[42px]">{plan.description}</CardDescription>
                  <p className="text-3xl font-bold tracking-tight">{formatPrice(plan)}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.tier === "free"
                      ? `${plan.dailyCap} daily / ${plan.monthlyCap} monthly cap`
                      : `${plan.monthlyCredits} credits per month`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {plan.features.map((feature) => (
                    <p key={`${plan.tier}-${feature}`} className="text-sm text-muted-foreground">
                      • {feature}
                    </p>
                  ))}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    className="w-full rounded-xl"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={buttonDisabled}
                    onClick={() => handleCheckout(plan.tier)}
                  >
                    {isBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isCurrent
                      ? "Current Plan"
                      : isDowngradeFree
                        ? "Contact Support to Downgrade"
                        : plan.tier === "enterprise"
                          ? "Contact Sales"
                          : "Choose Plan"}
                  </Button>
                </CardFooter>
                {isRecommended ? (
                  <div className="px-6 pb-5">
                    <Badge className="bg-secondary text-secondary-foreground text-[10px] uppercase tracking-wider">
                      Recommended Upgrade
                    </Badge>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
