export type CloudSaveState = "idle" | "pending" | "saving" | "saved" | "offline" | "conflict" | "auth-required" | "error";
export type CloudSaveFailureKind = "transient" | "conflict" | "auth" | "validation" | "fatal";

export class CloudSaveFailure extends Error {
  constructor(public kind: CloudSaveFailureKind, message: string, public retryAfterMs?: number) { super(message); }
}

export type CloudRequest<T> = {
  idempotencyKey: string;
  localRevision: number;
  baseVersion: number;
  baseIrVersion: number;
  value: T;
};

export type CloudResult = { version: number; irVersion: number; [key: string]: unknown };

type Timer = ReturnType<typeof setTimeout>;
type Options<T> = {
  baseVersion: number;
  baseIrVersion: number;
  build: (value: T, context: Omit<CloudRequest<T>, "value">) => Promise<CloudRequest<T>> | CloudRequest<T>;
  send: (request: CloudRequest<T>) => Promise<CloudResult>;
  persist: (request: CloudRequest<T>) => Promise<void>;
  clear: (request: CloudRequest<T>) => Promise<void>;
  onSuccess: (request: CloudRequest<T>, result: CloudResult) => void;
  onState: (state: CloudSaveState, message?: string) => void;
  online?: () => boolean;
  idleMs?: number;
  maxMs?: number;
  initialRevision?: number;
};

/** Exactly one request can run. New edits remain pending behind it. Retries
 * retain the same idempotency key; successful old responses acknowledge only
 * their revision and cannot clear a different queued request. */
export class CloudSaveCoordinator<T> {
  private pending?: { value: T; revision: number };
  private retry?: CloudRequest<T>;
  private running?: Promise<void>;
  private idleTimer?: Timer;
  private maxTimer?: Timer;
  private dirtySince?: number;
  private revision = 0;
  private retries = 0;
  private stopped = false;
  private blocked = false;
  private baseVersion: number;
  private baseIrVersion: number;
  private readonly idleMs: number;
  private readonly maxMs: number;

  constructor(private options: Options<T>) {
    this.baseVersion = options.baseVersion;
    this.baseIrVersion = options.baseIrVersion;
    this.idleMs = options.idleMs ?? 5_000;
    this.maxMs = options.maxMs ?? 30_000;
    this.revision = options.initialRevision ?? 0;
  }

  get dirty() { return Boolean(this.pending || this.retry || this.running); }

  change(value: T) {
    if (this.stopped) return;
    this.pending = { value, revision: ++this.revision };
    if (this.blocked) return;
    this.options.onState("pending");
    if (!this.dirtySince) this.dirtySince = Date.now();
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => void this.flush(), this.idleMs);
    this.maxTimer ??= setTimeout(() => void this.flush(), this.maxMs);
  }

  async replay(request: CloudRequest<T>) {
    if (this.stopped) return;
    this.revision = Math.max(this.revision, request.localRevision);
    this.retry = request;
    await this.flush();
  }

  async flush() {
    this.clearSchedule();
    if (this.stopped || this.blocked || this.running) return this.running;
    let request: CloudRequest<T> | undefined;
    try { request = this.retry ?? await this.buildPending(); }
    catch { this.options.onState("error", "The local change could not be prepared for cloud saving. Browser recovery is preserved."); return; }
    if (!request) return;
    if (!this.isOnline()) {
      this.retry = request;
      try { await this.options.persist(request); this.options.onState("offline", "Cloud save is waiting for a connection."); }
      catch { this.options.onState("error", "Cloud retry could not be stored. Browser recovery still contains your latest local edit."); }
      return;
    }
    this.retry = undefined;
    this.running = this.execute(request).finally(() => {
      this.running = undefined;
      if (this.pending && !this.retry && !this.blocked && !this.stopped) void this.flush();
    });
    return this.running;
  }

  online() { if (this.dirty) void this.flush(); }
  offline() { if (this.dirty) this.options.onState("offline", "Cloud save is waiting for a connection."); }
  stop() { this.stopped = true; this.clearSchedule(); }

  private async buildPending() {
    const candidate = this.pending;
    if (!candidate) return undefined;
    const context = { idempotencyKey: crypto.randomUUID(), localRevision: candidate.revision, baseVersion: this.baseVersion, baseIrVersion: this.baseIrVersion };
    const request = await this.options.build(candidate.value, context);
    if (this.pending === candidate) this.pending = undefined;
    return request;
  }

  private async execute(request: CloudRequest<T>) {
    this.options.onState("saving");
    try {
      const result = await this.options.send(request);
      this.baseVersion = result.version;
      this.baseIrVersion = result.irVersion;
      this.retries = 0;
      await this.options.clear(request);
      this.options.onSuccess(request, result);
      if (this.pending) this.options.onState("pending");
      else { this.dirtySince = undefined; this.options.onState("saved"); }
    } catch (error) {
      const failure = error instanceof CloudSaveFailure ? error : new CloudSaveFailure("transient", "Cloud save could not be reached.");
      if (failure.kind === "transient") {
        this.retry = request;
        try { await this.options.persist(request); }
        catch { this.options.onState("error", "Cloud retry could not be stored. Browser recovery still contains your latest local edit."); return; }
        const delay = failure.retryAfterMs ?? Math.min(30_000, 1_000 * 2 ** this.retries++);
        this.options.onState(this.isOnline() ? "error" : "offline", `${failure.message} Retrying safely.`);
        if (this.isOnline() && !this.stopped) this.idleTimer = setTimeout(() => void this.flush(), delay);
        return;
      }
      this.retry = request;
      this.blocked = true;
      await this.options.persist(request).catch(() => undefined);
      this.options.onState(failure.kind === "conflict" ? "conflict" : failure.kind === "auth" ? "auth-required" : "error", failure.message);
    }
  }

  private clearSchedule() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.maxTimer) clearTimeout(this.maxTimer);
    this.idleTimer = undefined;
    this.maxTimer = undefined;
  }
  private isOnline() { return this.options.online?.() ?? true; }
}

export async function cloudResponseFailure(response: Response, body: { error?: string }) {
  if (response.status === 401 || response.status === 403) return new CloudSaveFailure("auth", "Your session no longer permits cloud saving. Sign in again; local recovery is preserved.");
  if (response.status === 409) return new CloudSaveFailure("conflict", "A newer cloud version exists. Local recovery is preserved; resolve the conflict before retrying.");
  if (response.status === 400 || response.status === 413 || response.status === 422) return new CloudSaveFailure("validation", body.error ?? "This change was rejected and will not be retried automatically.");
  const retryAfter = Number(response.headers.get("retry-after"));
  if (response.status === 429 || response.status >= 500) return new CloudSaveFailure("transient", body.error ?? "Cloud save is temporarily unavailable.", Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : undefined);
  return new CloudSaveFailure("fatal", body.error ?? "Cloud save failed.");
}
