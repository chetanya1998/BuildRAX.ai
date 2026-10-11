import { describe, expect, it, vi } from "vitest";
import { createJevJudge, JEV_ENDPOINT, type JevRequest } from "./jev";

const request: JevRequest = { state: "quoted data", questions: { check: { type: "choice", instructions: "Judge the data", criteria: { yes: "Supported", no: "Unsupported" } } } };
describe("TypeSafe transport", () => {
  it("uses the official endpoint, explicit model, bearer auth and abort signal", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ fixture: true })));
    const judge = createJevJudge({ apiKey: "test-key-not-live", model: "jev-fixture", fetcher });
    const signal = new AbortController().signal;
    expect(await judge.evaluate(request, { signal })).toEqual({ fixture: true });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(JEV_ENDPOINT); expect(init).toMatchObject({ method: "POST", redirect: "error", cache: "no-store", signal, headers: { authorization: "Bearer test-key-not-live" } });
    expect(JSON.parse(init!.body as string)).toEqual({ ...request, model: "jev-fixture" });
  });
  it("redacts error bodies and does not retry", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("sensitive vendor body", { status: 429 }));
    await expect(createJevJudge({ apiKey: "fixture", model: "fixture", fetcher }).evaluate(request, { signal: new AbortController().signal })).rejects.toMatchObject({ status: 429, message: "TypeSafe judgment request failed." });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each(["oversized", "malformed"])("rejects %s responses", async (kind) => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(kind === "oversized" ? "x".repeat(32_001) : "not json"));
    await expect(createJevJudge({ apiKey: "fixture", model: "fixture", fetcher }).evaluate(request, { signal: new AbortController().signal })).rejects.toMatchObject({ code: "invalid_model_output" });
  });
  it("checks configuration, cancellation and request bytes before fetching", async () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(() => createJevJudge({ apiKey: "", model: "fixture", fetcher })).toThrow();
    const judge = createJevJudge({ apiKey: "fixture", model: "fixture", fetcher });
    await expect(judge.evaluate(request, { signal: AbortSignal.abort() })).rejects.toThrow();
    await expect(judge.evaluate({ ...request, state: "x".repeat(40_001) }, { signal: new AbortController().signal })).rejects.toThrow("byte limit");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
