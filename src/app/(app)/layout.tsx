import { Sidebar } from "@/components/Sidebar";

import { PageTransition } from "@/components/ui/PageTransition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative bg-surface/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}