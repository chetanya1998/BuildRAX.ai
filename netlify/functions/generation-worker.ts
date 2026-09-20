/** Bounded scheduled entrypoint for durable architecture generation jobs. */
export default async function handler() {
  if (process.env.GENERATION_WORKER_ENABLED !== "true") {
    return new Response("Generation worker is disabled until deployment verification completes.", { status: 503 });
  }
  const siteUrl = process.env.URL;
  const secret = process.env.GENERATION_WORKER_SECRET;
  if (!siteUrl || !secret) return new Response("Generation worker is not configured.", { status: 503 });
  const response = await fetch(new URL("/api/internal/generation-worker", siteUrl), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(55_000),
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}

export const config = { schedule: "* * * * *" };
