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
  title: "BuildRAX.ai — Design Backend Workflows Before Writing Code",
  description:
    "Visually map backend systems, run workflow checks, simulate behavior, and export developer-ready architecture outputs before writing code.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BuildRAX.ai — Design Backend Workflows Before Writing Code",
    description:
      "Map backend workflows visually, validate logic, simulate failures, and export developer-ready architecture outputs.",
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html:
              "try{document.body.removeAttribute('data-new-gr-c-s-check-loaded');document.body.removeAttribute('data-gr-ext-installed');}catch(e){}",
          }}
        />
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
