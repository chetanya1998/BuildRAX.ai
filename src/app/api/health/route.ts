import { NextResponse } from "next/server";
import { checkRuntimeConfig } from "@/lib/config/runtime-requirements";

export const dynamic = "force-dynamic";

/**
 * Public readiness probe. Reports which capabilities are configured without
 * revealing variable names or values; the build gate and startup log name them.
 */
export async function GET() {
  const report = checkRuntimeConfig(process.env);
  return NextResponse.json({
    status: report.ok ? "ok" : "degraded",
    capabilities: report.capabilities,
    aiProvider: report.aiProvider,
    checkedAt: new Date().toISOString(),
  }, { status: report.ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
