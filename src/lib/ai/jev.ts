import "server-only";
import { z } from "zod";
import { AIOutputError } from "./errors";

export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const choiceAnswerSchema = z.object({
  type: z.literal("choice"), choice: z.string().min(1).max(80),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.string().min(1).max(80), z.number().min(0).max(1)),
}).strict();
export type JevQuestion = { type: "choice"; instructions: string; criteria: Record<string, string> };
export type JevRequest = { state: string; questions: Record<string, JevQuestion> };
export interface JevJudge {
  readonly id: "typesafe";
  readonly model: string;
  evaluate(request: JevRequest, context: { signal: AbortSignal }): Promise<unknown>;
}
const responseSchema = z.object({
  model: z.string().min(1).max(160),
  answers: z.record(z.string(), choiceAnswerSchema),
  usage: z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() }).strict(),
}).strict();

/** The provider's type guarantee is not a semantic or trust guarantee. */
export function parseJevResponse(raw: unknown, questions: JevRequest["questions"]) {
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) throw new AIOutputError("Jev returned invalid typed judgments.");
  const result = parsed.data;
  const sameKeys = (a: object, b: object) => JSON.stringify(Object.keys(a).sort()) === JSON.stringify(Object.keys(b).sort());
  if (!sameKeys(result.answers, questions)) throw new AIOutputError("Jev returned mismatched question keys.");
  for (const [id, answer] of Object.entries(result.answers)) {
    const probabilities = Object.values(answer.probabilities);
    if (!sameKeys(answer.probabilities, questions[id].criteria)
      || !Object.hasOwn(questions[id].criteria, answer.choice)
      || Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 1) > .01
      || answer.probabilities[answer.choice] < Math.max(...probabilities)) {
      throw new AIOutputError("Jev returned inconsistent choice probabilities.");
    }
  }
  return result;
}

/** Dormant server adapter. No env auto-enable or public route. A trusted caller
 * must acquire O01 shared admission BEFORE injecting this adapter into gateway.
 * Model is explicit so deployments can pin an account-available version. */
export function createJevJudge(options: { apiKey: string; model: string; fetcher?: typeof fetch }): JevJudge {
  const apiKey = z.string().trim().min(1).max(1_000).refine((value) => !/[\r\n]/.test(value)).parse(options.apiKey);
  const model = z.string().trim().min(1).max(160).parse(options.model);
  return {
    id: "typesafe", model,
    async evaluate(request, { signal }) {
      signal.throwIfAborted();
      const body = JSON.stringify({ ...request, model });
      if (new TextEncoder().encode(body).byteLength > 40_000) throw new Error("Jev request exceeds the byte limit.");
      const response = await (options.fetcher ?? fetch)(JEV_ENDPOINT, {
        method: "POST", redirect: "error", cache: "no-store", signal,
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body,
      });
      if (!response.ok) {
        await response.body?.cancel();
        // Never include vendor body text, credentials or evidence in errors.
        throw Object.assign(new Error("TypeSafe judgment request failed."), { status: response.status });
      }
      const reader = response.body?.getReader();
      if (!reader) throw new AIOutputError("Jev returned an empty response.");
      const decoder = new TextDecoder();
      let bytes = 0; let text = "";
      try {
        while (true) {
          signal.throwIfAborted();
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > 32_000) throw new AIOutputError("Jev response exceeds the byte limit.");
          text += decoder.decode(part.value, { stream: true });
        }
        text += decoder.decode();
      } finally { await reader.cancel(); reader.releaseLock(); }
      signal.throwIfAborted();
      try { return JSON.parse(text) as unknown; }
      catch { throw new AIOutputError("Jev returned malformed JSON."); }
    },
  };
}
