"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Layers, 
  Library, 
  GraduationCap, 
  CreditCard,
  LogOut,
  BrainCircuit,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProgressSummary } from "@/lib/gamification";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Workflows", href: "/workflows", icon: Layers },
  { name: "AI Architect", href: "/builder", icon: BrainCircuit },
  { name: "Templates", href: "/templates", icon: Library },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Learn", href: "/learn", icon: GraduationCap },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  
  const { data: progress } = useSWR<ProgressSummary>(
    session?.user ? "/api/user/progress" : null,
    fetcher
  );

  const user = session?.user;
  const xp = progress?.xpInCurrentLevel || 0;
  const level = progress?.level || 1;
  const xpThreshold = progress?.xpRequiredForNextLevel || 1000;
  const progressPercentage = progress?.progressPercentage || 0;

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col border-r transition-all duration-300 relative z-50 shrink-0",
        "bg-[oklch(0.13_0.018_250/0.95)] backdrop-blur-xl border-[oklch(0.3_0.02_250/0.18)]",
        isCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Brand */}
      <div className={cn("h-14 flex items-center border-b border-[oklch(0.3_0.02_250/0.15)]", isCollapsed ? "justify-center px-3" : "px-4")}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          {!isCollapsed && <span className="font-bold text-base tracking-tight text-foreground">BuildRAX</span>}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className={cn("flex-1 py-3 space-y-0.5", isCollapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-2.5 py-2 rounded-lg transition-all duration-150 group relative",
                isCollapsed ? "justify-center px-0 w-9 mx-auto" : "px-3",
                isActive 
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(91,156,246,0.10)]" 
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground border border-transparent"
              )}
            >
              <item.icon className={cn(
                "shrink-0 transition-colors",
                isCollapsed ? "w-4 h-4" : "w-4 h-4",
                isActive ? "text-primary" : "group-hover:text-foreground"
              )} />
              {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              
              {/* Active accent bar */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Profile & XP */}
      <div className={cn("mt-auto border-t border-[oklch(0.3_0.02_250/0.15)] space-y-3", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
        {!isCollapsed && (
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Level {level}</span>
              <span className="text-[10px] text-muted-foreground">{Math.floor(xp)}/{Math.floor(xpThreshold)} XP</span>
            </div>
            <Progress value={progressPercentage} className="h-1 bg-white/5" />
          </div>
        )}

        <div className={cn(
          "flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/[0.07]",
          isCollapsed ? "justify-center" : ""
        )}>
          <Avatar className="w-7 h-7 border border-primary/20 shrink-0">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
              {user?.name?.charAt(0)?.toUpperCase() || "G"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user?.name || "Guest"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || "anonymous"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive transition-colors shrink-0"
                onClick={() => signOut()}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-[oklch(0.3_0.02_250/0.3)] bg-[oklch(0.16_0.018_250)] shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-110 z-50"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
