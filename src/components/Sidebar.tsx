"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Layers,
  Library,
  LogOut,
  Settings,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Workflows", href: "/workflows", icon: Layers },
  { name: "Builder", href: "/builder", icon: Workflow },
  { name: "Templates", href: "/templates", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <aside
      className={cn(
        "relative z-50 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#0A0D14]/96 text-[#F5F7FB] backdrop-blur-xl transition-all duration-300",
        isCollapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-white/10", isCollapsed ? "justify-center px-3" : "px-4")}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2F7BFF]/30 bg-[#2F7BFF]/12">
            <Workflow className="h-4 w-4 text-[#6EA4FF]" />
          </div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">BuildRAX</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Backend Studio</p>
            </div>
          ) : null}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-1 py-3", isCollapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/workflows" && pathname?.startsWith("/workflows")) ||
            (item.href === "/builder" && pathname?.startsWith("/builder"));
          return (
            <Link
              key={`${item.name}-${item.href}`}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg border py-2 text-sm transition",
                isCollapsed ? "mx-auto h-9 w-9 justify-center px-0" : "px-3",
                isActive
                  ? "border-[#2F7BFF]/30 bg-[#2F7BFF]/14 text-[#9EC0FF] shadow-[0_0_18px_rgba(47,123,255,0.12)]"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed ? <span className="truncate font-medium">{item.name}</span> : null}
              {isActive && !isCollapsed ? <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#2F7BFF]" /> : null}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed ? (
        <div className="mx-3 mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <BellRing className="h-3.5 w-3.5 text-[#6EA4FF]" />
            Non-AI MVP Mode
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">Review, simulation, Mermaid, and exports run deterministically without provider keys.</p>
        </div>
      ) : null}

      <div className={cn("border-t border-white/10", isCollapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2", isCollapsed && "justify-center")}>
          <Avatar className="h-7 w-7 shrink-0 border border-[#2F7BFF]/20">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="bg-[#2F7BFF]/10 text-xs text-[#9EC0FF]">
              {user?.name?.charAt(0)?.toUpperCase() || "G"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{user?.name || "Guest Builder"}</p>
                <p className="truncate text-[10px] text-slate-500">{user?.email || "local draft mode"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-500 hover:text-white" onClick={() => signOut()}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <button
        onClick={() => setIsCollapsed((value) => !value)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#101726] text-slate-400 shadow-lg transition hover:text-white"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
