import { gunzipSync, gzipSync } from "node:zlib";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalSha256, canonicalStringify } from "@/lib/architecture-ir/snapshot";
import { apiError, HttpError } from "@/lib/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

function authorize(request: Request) {
  const expected = process.env.ARCHIVE_WORKER_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || expected.length < 32 || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    throw new HttpError(401, "Maintenance worker authentication failed.");
  }
}

export async function POST(request: Request) {
  const workerId = crypto.randomUUID();
  try {
    authorize(request);
    const admin = createSupabaseAdminClient();
    if (!admin) throw new HttpError(503, "Maintenance storage is not configured.");
    const scheduled = await admin.rpc("schedule_architecture_archives", { reference_time: new Date().toISOString() });
    if (scheduled.error) throw new HttpError(500, "Archive scheduling failed.");
    const leased = await admin.rpc("lease_artifact_archive_jobs", { worker_id: workerId, batch_size: 10 });
    if (leased.error) throw new HttpError(500, "Archive leasing failed.");
    let archived = 0;
    let archiveFailures = 0;
    for (const job of leased.data ?? []) {
      try {
        if (!job.artifact_payload || await canonicalSha256(job.artifact_payload) !== job.artifact_checksum) throw new Error("source-checksum-mismatch");
        const path = `${job.workspace_id}/${job.artifact_kind}/${job.artifact_checksum}.json.gz`;
        const content = gzipSync(Buffer.from(canonicalStringify(job.artifact_payload), "utf8"));
        const uploaded = await admin.storage.from("architecture-version-archive").upload(path, content, { contentType: "application/gzip", upsert: true });
        if (uploaded.error) throw new Error("storage-upload-failed");
        const verificationDownload = await admin.storage.from("architecture-version-archive").download(path);
        if (verificationDownload.error || !verificationDownload.data) throw new Error("storage-verification-download-failed");
        const verifiedBytes = new Uint8Array(await verificationDownload.data.arrayBuffer());
        const verifiedPayload = JSON.parse(gunzipSync(verifiedBytes).toString("utf8")) as unknown;
        if (await canonicalSha256(verifiedPayload) !== job.artifact_checksum) throw new Error("storage-checksum-mismatch");
        const completed = await admin.rpc("complete_artifact_archive_job", {
          worker_id: workerId,
          target_job: job.job_id,
          archive_path: path,
          verified_checksum: job.artifact_checksum,
        });
        if (completed.error) throw new Error("archive-commit-failed");
        archived += 1;
      } catch (error) {
        archiveFailures += 1;
        await admin.rpc("fail_artifact_archive_job", {
          worker_id: workerId,
          target_job: job.job_id,
          failure_class: error instanceof Error ? error.message : "unknown-archive-failure",
        });
      }
    }

    const notificationLease = await admin.rpc("lease_notification_jobs", { worker_id: workerId, batch_size: 10 });
    let delivered = 0;
    let deliveryFailures = 0;
    for (const job of notificationLease.data ?? []) {
      try {
        const key = process.env.RESEND_API_KEY;
        const from = process.env.ARCHIVE_NOTICE_FROM_EMAIL;
        if (!key || !from) throw new Error("email-provider-unconfigured");
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({
            from,
            to: [job.recipient_email],
            subject: "BuildRAX architecture history notice",
            text: "A non-current architecture version is scheduled to move to encrypted archival storage in seven days. It remains available from version history and can be restored at any time.",
          }),
          signal: AbortSignal.timeout(8_000),
        });
        if (!response.ok) throw new Error(`email-provider-${response.status}`);
        const result = await response.json() as { id?: string };
        await admin.rpc("complete_notification_job", { worker_id: workerId, target_job: job.job_id, provider_id: result.id ?? null });
        delivered += 1;
      } catch (error) {
        deliveryFailures += 1;
        await admin.rpc("fail_notification_job", {
          worker_id: workerId,
          target_job: job.job_id,
          failure_class: error instanceof Error ? error.message : "unknown-delivery-failure",
        });
      }
    }
    return NextResponse.json({
      scheduled: scheduled.data?.[0] ?? { notifications_created: 0, jobs_created: 0 },
      archived,
      archiveFailures,
      delivered,
      deliveryFailures,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
