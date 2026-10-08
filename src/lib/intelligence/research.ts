import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { compileContextPack, contextPackSchema, type ContextBudget } from "./context";
import { evidenceIRSchema, researchUrlSchema, type EvidenceIR } from "./schema";

export const researchRequestSchema = z.object({
  /** Deliberate public search query, never the full private project context. */
  query: z.string().trim().min(4).max(300).refine((value) => !/[<>\u0000-\u001f]/.test(value)),
  freshness: z.enum(["auto", "current", "stable"]).default("auto"),
}).strict();
export type ResearchRequest = z.infer<typeof researchRequestSchema>;

export const researchSourceSchema = z.object({
  url: researchUrlSchema,
  title: z.string().trim().min(1).max(160),
  excerpt: z.string().trim().min(1).max(8_000),
  publishedAt: z.iso.datetime().optional(),
  retrievedAt: z.iso.datetime(),
}).strict();
export type ResearchSource = z.infer<typeof researchSourceSchema>;

/** Server-injected adapter; implement network allowlists, byte limits and shared
 * admission before enabling a real backend. Never fetch URLs from source text. */
export interface ResearchSearchAdapter {
  search(query: string, context: { requestId: string; signal: AbortSignal; limit: number }): Promise<unknown>;
}
export type ResearchOptions = {
  adapter?: ResearchSearchAdapter;
  cachedSources?: readonly ResearchSource[];
  maxAgeDays?: number;
  minSources?: number;
  contextBudget?: Partial<ContextBudget>;
  now?: () => number;
};

const rejectionSchema = z.enum(["invalid", "unsafe-text", "undated", "future", "stale", "irrelevant", "duplicate", "limit"]);
type Rejection = z.infer<typeof rejectionSchema>;
export const researchResultSchema = z.object({
  status: z.enum(["not-needed", "cached", "ready", "insufficient", "unavailable"]),
  reason: z.enum(["stable-question", "fresh-cache", "fresh-sources", "insufficient-sources", "context-budget", "adapter-unconfigured", "adapter-failed", "invalid-response"]),
  need: z.enum(["stable", "freshness-sensitive"]),
  searchCalls: z.number().int().min(0).max(1),
  evidence: evidenceIRSchema.nullable(),
  contextPack: contextPackSchema,
  coverage: z.object({ retainedSources: z.number().int().min(0).max(10), distinctHosts: z.number().int().min(0).max(10), minimumSources: z.number().int().min(1).max(5), semanticSufficiency: z.literal("not-evaluated") }).strict(),
  rejected: z.array(z.object({ reason: rejectionSchema, count: z.number().int().min(1) }).strict()).max(8),
}).strict();

const policySchema = z.object({
  maxAgeDays: z.number().int().min(1).max(365).default(30),
  minSources: z.number().int().min(1).max(5).default(2),
});
const budgetSchema = z.object({
  inputTokens: z.number().int().min(256).max(8_000).default(4_000),
  outputTokens: z.number().int().min(64).max(2_000).default(1_000),
});
const hash = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 32);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const stopwords = new Set("the and for with what which how does latest current recent today version pricing price release support supported security advisory best practices".split(" "));
const tokens = (text: string) => [...new Set(text.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]{2,}/g) ?? [])].filter((word) => !stopwords.has(word));

export function detectResearchNeed(input: ResearchRequest) {
  const request = researchRequestSchema.parse(input);
  if (request.freshness === "stable") return "stable" as const;
  return request.freshness === "current" || /\b(latest|current|recent|today|pricing|prices?|versions?|releases?|deprecated|deprecation|vulnerabilit\w*|cve|202\d)\b/i.test(request.query)
    ? "freshness-sensitive" as const : "stable" as const;
}

// Defense in depth only. Unmatched prose still remains untrusted data; it is
// never executed, promoted into an instruction or passed to a model here.
const unsafeText = /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]|ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+instructions|(?:system|developer|assistant)\s*:|(?:reveal|send|exfiltrate)\b.{0,60}\b(?:secret|token|key|password)|\b(?:run|execute)\s+(?:this|the)\s+(?:command|script)|\b(?:curl|wget)\s+https?:/i;

function canonicalUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^utm_|^(gclid|fbclid)$/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  return url.href;
}

/** Internal implementation. Call through runResearch in the shared AI gateway. */
export async function collectResearch(request: ResearchRequest, context: { requestId: string; signal: AbortSignal }, options: ResearchOptions = {}) {
  const policy = policySchema.parse(options);
  const budget = budgetSchema.parse(options.contextBudget ?? {});
  const now = z.number().finite().nonnegative().max(8.64e15).parse((options.now ?? Date.now)());
  const need = detectResearchNeed(request);
  const rejected = new Map<Rejection, number>();
  const reject = (reason: Rejection) => rejected.set(reason, (rejected.get(reason) ?? 0) + 1);
  const terms = tokens(request.query);
  const retained = new Map<string, ResearchSource>();
  const excerpts = new Set<string>();

  function filter(candidates: unknown[]) {
    const parsed: ResearchSource[] = [];
    for (const candidate of candidates) {
      const result = researchSourceSchema.safeParse(candidate);
      if (!result.success) { reject("invalid"); continue; }
      parsed.push({ ...result.data, url: canonicalUrl(result.data.url) });
    }
    // Stable ordering, newest source first, irrespective of search ranking.
    parsed.sort((a, b) => (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0) || compare(a.url, b.url) || compare(JSON.stringify(a), JSON.stringify(b)));
    for (const source of parsed) {
      context.signal.throwIfAborted();
      if (unsafeText.test(source.title + "\n" + source.excerpt)) { reject("unsafe-text"); continue; }
      if (!source.publishedAt) { reject("undated"); continue; }
      const published = Date.parse(source.publishedAt); const retrieved = Date.parse(source.retrievedAt);
      if (published > now || retrieved > now || published > retrieved) { reject("future"); continue; }
      if (now - published > policy.maxAgeDays * 86_400_000 || now - retrieved > policy.maxAgeDays * 86_400_000) { reject("stale"); continue; }
      // Extract a bounded literal excerpt. Match that excerpt, not a bait title.
      const claim = source.excerpt.slice(0, 500).trim();
      if (claim.length < 10 || !terms.length || !terms.some((term) => tokens(claim).includes(term))) { reject("irrelevant"); continue; }
      const fingerprint = claim.replace(/\s+/g, " ").toLowerCase();
      if (retained.has(source.url) || excerpts.has(fingerprint)) { reject("duplicate"); continue; }
      if (retained.size >= 10) { reject("limit"); continue; }
      retained.set(source.url, { ...source, excerpt: claim }); excerpts.add(fingerprint);
    }
  }
  function result(status: z.infer<typeof researchResultSchema>["status"], reason: z.infer<typeof researchResultSchema>["reason"], searchCalls: number) {
    const sources = [...retained.values()].sort((a, b) => compare(a.url, b.url));
    const records = sources.map((source) => ({ ...source, id: hash(JSON.stringify(source)) }));
    const evidence: EvidenceIR | null = records.length ? evidenceIRSchema.parse({
      schemaVersion: "1.0.0", sourceSetId: `eset_${hash(records.map((item) => item.id).join("|"))}`,
      sources: records.map((source) => ({ id: `src_${source.id}`, type: "research", label: source.title })),
      items: records.map((source) => ({
        id: `ev_${source.id}`, claim: source.excerpt, category: "technology", origin: "research-source",
        verification: "source-observed", confidence: 0.5,
        locations: [{ type: "research", sourceId: `src_${source.id}`, url: source.url, publishedAt: source.publishedAt, retrievedAt: source.retrievedAt, quote: source.excerpt, trust: "untrusted-external" }],
      })),
    }) : null;
    const contextPack = compileContextPack({ task: "research-extraction", budget, blocks: (evidence?.items ?? []).map((item) => ({
      id: item.id, kind: "evidence", format: "json", sourceRefs: [item.id],
      text: JSON.stringify({ trust: "untrusted-external", claim: item.claim, attribution: item.locations }),
    })) });
    const contextIds = new Set(contextPack.blocks.flatMap((block) => block.sourceRefs));
    const contextHosts = new Set(records.filter((record) => contextIds.has(`ev_${record.id}`)).map((record) => new URL(record.url).hostname));
    const budgetInsufficient = (status === "ready" || status === "cached") && contextHosts.size < policy.minSources;
    return researchResultSchema.parse({ status: budgetInsufficient ? "insufficient" : status, reason: budgetInsufficient ? "context-budget" : reason, need, searchCalls, evidence, contextPack,
      coverage: { retainedSources: records.length, distinctHosts: new Set(sources.map((source) => new URL(source.url).hostname)).size, minimumSources: policy.minSources, semanticSufficiency: "not-evaluated" },
      rejected: [...rejected].sort(([a], [b]) => compare(a, b)).map(([reason, count]) => ({ reason, count })),
    });
  }
  const enough = () => new Set([...retained.values()].map((source) => new URL(source.url).hostname)).size >= policy.minSources;
  context.signal.throwIfAborted();
  if (need === "stable") return result("not-needed", "stable-question", 0);
  const cached = z.array(z.unknown()).max(30).parse(options.cachedSources ?? []);
  filter(cached);
  if (enough()) return result("cached", "fresh-cache", 0);
  if (!options.adapter) return result("unavailable", "adapter-unconfigured", 0);
  let raw: unknown;
  try {
    context.signal.throwIfAborted();
    raw = await options.adapter.search(request.query, { requestId: context.requestId, signal: context.signal, limit: 30 });
    context.signal.throwIfAborted();
  } catch {
    context.signal.throwIfAborted();
    return result("unavailable", "adapter-failed", 1);
  }
  const batch = z.array(z.unknown()).max(30).safeParse(raw);
  if (!batch.success) return result("unavailable", "invalid-response", 1);
  // Re-rank cache and search together so an older cached URL cannot shadow
  // an updated source returned by the adapter. Recompute diagnostics once.
  retained.clear(); excerpts.clear(); rejected.clear();
  filter([...cached, ...batch.data]);
  return enough() ? result("ready", "fresh-sources", 1) : result("insufficient", "insufficient-sources", 1);
}
