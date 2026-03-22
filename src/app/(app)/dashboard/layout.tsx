import Link from "next/link";
import { BrainCircuit, Compass, LayoutDashboard, Settings, User } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/10 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <Link href="/" className="flex items-center gap-2 text-foreground font-semibold">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <span>BuildRAX</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/templates" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all">
            <Compass className="w-5 h-5" />
            Explore
          </Link>
          <Link href="/learn" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all">
            <BrainCircuit className="w-5 h-5" />
            Learn Mode
          </Link>
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all">
            <User className="w-5 h-5" />
            Profile & XP
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Test User</span>
              <span className="text-xs text-muted-foreground">Lvl 2 AI Builder</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-primary opacity-[0.03] pointer-events-none" />
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
