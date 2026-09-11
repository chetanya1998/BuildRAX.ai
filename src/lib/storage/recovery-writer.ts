export type RecoveryStatus = "pending" | "saving" | "saved" | "error";

/** One local write at a time; edits arriving during a write replace only the
 * waiting snapshot, never the in-flight one. A failed write stays retryable. */
export class RecoveryWriter<T> {
  private pending: { value: T } | undefined;
  private running: Promise<void> | undefined;
  private failed = false;
  constructor(private write: (value: T) => Promise<void>, private status: (state: RecoveryStatus, error?: unknown) => void) {}

  get dirty() { return Boolean(this.pending || this.running || this.failed); }

  enqueue(value: T) {
    this.pending = { value };
    // Do not hide a failure when the user continues editing.
    if (!this.failed) this.status("pending");
  }

  flush(retry = true): Promise<void> {
    if (this.running) return this.running;
    if (this.failed && !retry) return Promise.resolve();
    if (!this.pending) return Promise.resolve();
    this.running = this.drain().finally(() => { this.running = undefined; });
    return this.running;
  }

  private async drain() {
    while (this.pending) {
      const next = this.pending;
      this.pending = undefined;
      this.status("saving");
      try {
        await this.write(next.value);
        this.failed = false;
      } catch (error) {
        this.pending ??= next;
        this.failed = true;
        this.status("error", error);
        return;
      }
    }
    this.status("saved");
  }
}

export function recoveryErrorMessage(error: unknown) {
  const name = error && typeof error === "object" && "name" in error ? error.name : "";
  if (name === "QuotaExceededError") return "Browser storage is full. Your latest changes are not saved locally. Download a recovery copy, then free space and retry.";
  if (error instanceof Error && error.message.includes("Another tab")) return error.message;
  return "Browser recovery is unavailable. Your latest changes may exist only in this tab. Download a recovery copy before leaving, then retry.";
}
