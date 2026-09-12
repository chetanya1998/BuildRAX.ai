/** Hourly entrypoint for archival scheduling, hydration readiness, and email outbox delivery. */
export default async function handler() {
  if (process.env.ARCHIVE_MAINTENANCE_ENABLED !== "true") {
    return new Response("Maintenance worker is disabled until release verification completes.", { status: 503 });
  }
  const siteUrl = process.env.URL;
  const secret = process.env.ARCHIVE_WORKER_SECRET;
  if (!siteUrl || !secret) return new Response("Maintenance worker is not configured.", { status: 503 });
  const response = await fetch(new URL("/api/internal/architecture-maintenance", siteUrl), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(55_000),
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}

export const config = { schedule: "@hourly" };
