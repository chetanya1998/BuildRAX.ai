"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Try BuildRAX",
    price: "Free",
    badge: "Try first",
    href: "/builder",
    features: ["Guest mode", "Build workflows", "Use templates", "Run deterministic review", "Run simulation", "Export basic artifacts"],
  },
  {
    name: "Builder Pro",
    price: "Coming soon",
    badge: "Coming soon",
    href: "#pricing",
    features: ["Saved workspaces", "Advanced exports", "Version history", "Reusable custom nodes", "Expanded scenario library"],
  },
  {
    name: "Team Studio",
    price: "Coming soon",
    badge: "Coming soon",
    href: "#pricing",
    features: ["Team collaboration", "Shared templates", "Governance reviews", "AI-assisted architecture", "Workspace policies"],
  },
];

export function PricingTiers() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {tiers.map((tier, index) => (
        <div key={tier.name} className={index === 0 ? "flex min-h-[420px] flex-col rounded-xl border border-[#2F7BFF]/35 bg-[#2F7BFF]/10 p-5" : "flex min-h-[420px] flex-col rounded-xl border border-white/10 bg-white/[0.03] p-5"}>
          <p className="text-sm font-semibold text-white">{tier.name}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{tier.price}</p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                {feature}
              </li>
            ))}
          </ul>
          <Button className="mt-6 h-11 w-full rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" asChild={index === 0}>
            {index === 0 ? <Link href={tier.href}>{tier.badge}</Link> : <span>{tier.badge}</span>}
          </Button>
        </div>
      ))}
    </div>
  );
}
