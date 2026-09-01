import type { Metadata } from "next";
import "animate.css";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BuildRAX — Architecture with clarity", template: "%s · BuildRAX" },
  description: "Design, review and document software architecture with a semantic canvas and AI assistance.",
  metadataBase: new URL(process.env.URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
