import { describe, expect, it, vi } from "vitest";
import { RecoveryWriter, recoveryErrorMessage } from "./recovery-writer";

describe("serialized local recovery", () => {
  it("writes the latest edit after an in-flight save, without acknowledging newer work early", async () => {
    let finish!: () => void;
    const blocked = new Promise<void>((resolve) => { finish = resolve; });
    const writes: string[] = [];
    const status = vi.fn();
    const writer = new RecoveryWriter<string>(async (value) => { writes.push(value); if (value === "first") await blocked; }, status);
    writer.enqueue("first");
    const saving = writer.flush();
    writer.enqueue("second");
    writer.enqueue("latest");
    expect(writer.dirty).toBe(true);
    expect(status).not.toHaveBeenCalledWith("saved");
    expect(writer.flush()).toBe(saving);
    finish();
    await saving;
    expect(writes).toEqual(["first", "latest"]);
    expect(status.mock.calls.at(-1)).toEqual(["saved"]);
    expect(writer.dirty).toBe(false);
  });

  it("retains newer work after a failed write and retries only when requested", async () => {
    let fail!: (error: Error) => void;
    const blocked = new Promise<void>((_, reject) => { fail = reject; });
    const write = vi.fn().mockImplementationOnce(() => blocked).mockResolvedValue(undefined);
    const status = vi.fn();
    const writer = new RecoveryWriter<string>(write, status);
    writer.enqueue("old");
    const saving = writer.flush();
    writer.enqueue("new");
    fail(new DOMException("Quota full", "QuotaExceededError"));
    await saving;
    expect(writer.dirty).toBe(true);
    expect(status.mock.calls.at(-1)?.[0]).toBe("error");
    await writer.flush(false);
    expect(write).toHaveBeenCalledTimes(1);
    await writer.flush();
    expect(write.mock.calls.map(([value]) => value)).toEqual(["old", "new"]);
    expect(writer.dirty).toBe(false);
  });

  it("can retry an unchanged failed snapshot", async () => {
    const write = vi.fn().mockRejectedValueOnce(new Error("blocked")).mockResolvedValue(undefined);
    const writer = new RecoveryWriter<string>(write, vi.fn());
    writer.enqueue("");
    await writer.flush();
    await writer.flush();
    expect(write.mock.calls).toEqual([[""], [""]]);
  });

  it("provides actionable, content-free errors", () => {
    expect(recoveryErrorMessage(new DOMException("sensitive data", "QuotaExceededError"))).toContain("storage is full");
    expect(recoveryErrorMessage(new Error("secret content"))).not.toContain("secret content");
  });
});
