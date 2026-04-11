import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/Providers";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const FONT_VARIABLES: CSSProperties = {
  ["--font-sans" as string]:
    '"Space Grotesk", "Satoshi", "Avenir Next", "Segoe UI", system-ui, sans-serif',
  ["--font-geist-mono" as string]:
    '"JetBrains Mono", "Geist Mono", "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace',
};

export const metadata: Metadata = {
  title: "BuildRAX.ai — Build AI Visually",
  description:
    "Drag, drop, and wire AI agents visually. Watch every prompt, tool call, and output flow in real time. Open source AI agent builder.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BuildRAX.ai — Build AI Visually",
    description:
      "Drag, drop, and wire AI agents visually. Open source AI agent builder.",
    type: "website",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      style={FONT_VARIABLES}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextTopLoader color="#22d3ee" showSpinner={false} height={3} shadow="0 0 10px #22d3ee,0 0 5px #22d3ee" />
        <Toaster position="top-right" richColors toastOptions={{
          style: {
            background: 'rgba(9, 9, 11, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
          },
        }} />
        <Providers>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
