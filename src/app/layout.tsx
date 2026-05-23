import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Providers } from "@/components/Providers";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={FONT_VARIABLES}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('buildrax:theme')==='light'?'light':'dark';document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;document.body.removeAttribute('data-new-gr-c-s-check-loaded');document.body.removeAttribute('data-gr-ext-installed');}catch(e){}",
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
