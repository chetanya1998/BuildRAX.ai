import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudSaveCoordinator, CloudSaveFailure, cloudResponseFailure, type CloudRequest, type CloudSaveState } from "./cloud-save-coordinator";

type Value = { title: string };
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: unknown) => void; const promise = new Promise<T>((ok, no) => { resolve = ok; reject = no; }); return { promise, resolve, reject }; }

function setup(send: (request: CloudRequest<Value>) => Promise<{ version: number; irVersion: number }>, online = () => true) {
  const states: CloudSaveState[] = [];
  const persisted: CloudRequest<Value>[] = [];
  const cleared: CloudRequest<Value>[] = [];
  const successes: Array<[CloudRequest<Value>, { version: number; irVersion: number }]> = [];
  const machine = new CloudSaveCoordinator<Value>({
    baseVersion: 10, baseIrVersion: 3, initialRevision: 7, idleMs: 5_000, maxMs: 30_000, online,
    build: (value, context) => ({ ...context, value }), send,
    persist: async (request) => { persisted.push(request); }, clear: async (request) => { cleared.push(request); },
    onSuccess: (request, result) => successes.push([request, result]), onState: (state) => states.push(state),
  });
  return { machine, states, persisted, cleared, successes };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-11T00:00:00Z")); });

describe("cloud save coordinator", () => {
  it("saves after five seconds idle and no later than thirty seconds during continuous edits", async () => {
    const send = vi.fn(async () => ({ version: 11, irVersion: 4 }));
    const { machine } = setup(send);
    machine.change({ title: "one" });
    await vi.advanceTimersByTimeAsync(4_999);
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(1);

    for (let second = 0; second < 30; second += 1) { machine.change({ title: `${second}` }); await vi.advanceTimersByTimeAsync(1_000); }
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("never marks newer edits saved when an older response finishes", async () => {
    const first = deferred<{ version: number; irVersion: number }>();
    const second = deferred<{ version: number; irVersion: number }>();
    const send = vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const { machine, states, successes } = setup(send);
    machine.change({ title: "old" });
    const saving = machine.flush();
    machine.change({ title: "new" });
    first.resolve({ version: 11, irVersion: 4 });
    await saving;
    await Promise.resolve();
    expect(send).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toBe("saving");
    expect(successes[0][0].value.title).toBe("old");
    expect(send.mock.calls[1][0].baseVersion).toBe(11);
    second.resolve({ version: 12, irVersion: 5 });
    await machine.flush();
    expect(states.at(-1)).toBe("saved");
    expect(successes[1][0].value.title).toBe("new");
  });

  it("persists a transient failure and retries the identical request with bounded backoff", async () => {
    const send = vi.fn().mockRejectedValueOnce(new CloudSaveFailure("transient", "temporary")).mockResolvedValue({ version: 11, irVersion: 3 });
    const { machine, persisted, cleared, states } = setup(send);
    machine.change({ title: "retry me" });
    await machine.flush();
    expect(persisted).toHaveLength(1);
    expect(states.at(-1)).toBe("error");
    await vi.advanceTimersByTimeAsync(1_000);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].idempotencyKey).toBe(send.mock.calls[0][0].idempotencyKey);
    expect(cleared[0].idempotencyKey).toBe(send.mock.calls[0][0].idempotencyKey);
  });

  it("waits offline and resumes without changing idempotency", async () => {
    let connected = false;
    const send = vi.fn(async () => ({ version: 11, irVersion: 3 }));
    const { machine, states } = setup(send, () => connected);
    machine.change({ title: "offline" });
    await machine.flush();
    expect(states.at(-1)).toBe("offline");
    expect(send).not.toHaveBeenCalled();
    expect(machine.dirty).toBe(true);
    connected = true;
    machine.online();
    await Promise.resolve(); await Promise.resolve();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["conflict", "conflict"], ["auth", "auth-required"], ["validation", "error"],
  ] as const)("does not automatically retry a %s response", async (kind, expected) => {
    const send = vi.fn().mockRejectedValue(new CloudSaveFailure(kind, "stop"));
    const { machine, states, persisted } = setup(send);
    machine.change({ title: "blocked" });
    await machine.flush();
    machine.online();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(persisted).toHaveLength(1);
    expect(states.at(-1)).toBe(expected);
  });

  it("classifies HTTP responses into safe retry categories", async () => {
    await expect(cloudResponseFailure(new Response("", { status: 401 }), {})).resolves.toMatchObject({ kind: "auth" });
    await expect(cloudResponseFailure(new Response("", { status: 409 }), {})).resolves.toMatchObject({ kind: "conflict" });
    await expect(cloudResponseFailure(new Response("", { status: 422 }), {})).resolves.toMatchObject({ kind: "validation" });
    await expect(cloudResponseFailure(new Response("", { status: 503 }), {})).resolves.toMatchObject({ kind: "transient" });
  });
});
