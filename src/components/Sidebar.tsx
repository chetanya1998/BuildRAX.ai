"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  Library, 
  GraduationCap, 
  User, 
  Settings,
  LogOut,
  BrainCircuit,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Workflows", href: "/dashboard#workflows", icon: Layers },
  { name: "Builder", href: "/builder", icon: PlusCircle },
  { name: "Templates", href: "/templates", icon: Library },
  { name: "Learn", href: "/learn", icon: GraduationCap },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();

  const user = session?.user;
  const xp = (user as any)?.xp || 240;
  const level = (user as any)?.level || 2;
  const xpThreshold = 1000;

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-300 relative z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-6 mb-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="font-bold text-lg tracking-tight">BuildRAX</span>}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary font-medium shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "group-hover:text-foreground"
              )} />
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
              
              {/* Active Indicator Ring */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Profile & XP */}
      <div className="p-4 mt-auto border-t border-border/40 space-y-4">
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Level {level} Builder</span>
              <span className="text-[10px] text-muted-foreground">{xp}/{xpThreshold} XP</span>
            </div>
            <Progress value={(xp / xpThreshold) * 100} className="h-1.5 bg-secondary/50" />
          </div>
        )}

        <div className={cn(
          "flex items-center gap-3 p-2 rounded-2xl bg-secondary/30 border border-border/40",
          isCollapsed ? "justify-center" : "px-3"
        )}>
          <Avatar className="w-8 h-8 border border-border/40">
            <AvatarImage src={user?.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">UN</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || "Anonymous"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || "No email"}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-110 z-50"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
