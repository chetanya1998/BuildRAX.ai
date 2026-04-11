"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { PageTransition } from "@/components/ui/PageTransition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBuilderRoute = pathname?.startsWith("/builder");

  return (
    <div className="flex h-screen overflow-hidden app-page-bg text-foreground">
      {!isBuilderRoute ? <Sidebar /> : null}
      <main className={`flex-1 relative ${isBuilderRoute ? "overflow-hidden bg-transparent" : "overflow-y-auto"}`}>
        {!isBuilderRoute ? (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        ) : null}
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
