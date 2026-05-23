"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTransition } from "@/components/ui/PageTransition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBuilderRoute = pathname?.startsWith("/builder");

  return (
    <SessionProvider>
      <TooltipProvider>
        <NextTopLoader color="#22d3ee" showSpinner={false} height={3} shadow="0 0 10px #22d3ee,0 0 5px #22d3ee" />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: "rgba(9, 9, 11, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
            },
          }}
        />
        <div className="flex h-screen overflow-hidden app-page-bg text-foreground">
          {!isBuilderRoute ? <Sidebar /> : null}
          <main className={`flex-1 relative ${isBuilderRoute ? "overflow-hidden bg-transparent" : "overflow-y-auto"}`}>
            {!isBuilderRoute ? (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            ) : null}
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </TooltipProvider>
    </SessionProvider>
  );
}
