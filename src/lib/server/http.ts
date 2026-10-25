import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_JSON_BYTES = 1_000_000;

export async function readJson(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) throw new HttpError(413, "Request body is too large.");
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BYTES) throw new HttpError(413, "Request body is too large.");
    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public headers?: HeadersInit) { super(message); }
}

export const SERVICE_UNAVAILABLE_MESSAGE = "This part of BuildRAX is temporarily unavailable. Anything you have already made is still in this browser. Please try again in a few minutes.";

/**
 * A server dependency or setting is unavailable. The operator detail is logged
 * server-side; users only ever see SERVICE_UNAVAILABLE_MESSAGE.
 */
export class ServiceUnavailableError extends HttpError {
  readonly code = "service_unavailable" as const;
  constructor(public readonly detail: string, headers: HeadersInit = { "retry-after": "30" }) {
    super(503, SERVICE_UNAVAILABLE_MESSAGE, headers);
    this.name = "ServiceUnavailableError";
  }
}

export function inputValidationError(error: z.ZodError, requestId?: string) {
  return NextResponse.json({
    error: "Check the architecture inputs and try again.",
    stage: "input-validation",
    fieldErrors: error.flatten().fieldErrors,
    requestId,
  }, {
    status: 422,
    headers: requestId ? { "x-request-id": requestId } : undefined,
  });
}

export function apiError(error: unknown) {
  if (error instanceof ServiceUnavailableError) {
    console.error("BuildRAX service unavailable", { detail: error.detail });
    return NextResponse.json({ error: error.message, code: error.code }, { status: 503, headers: error.headers });
  }
  // AI gateway configuration failures (see AIGatewayConfigurationError) are operator problems, not user errors.
  if (error instanceof Error && "code" in error && error.code === "gateway_configuration") {
    return apiError(new ServiceUnavailableError(error.message));
  }
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status, headers: error.headers });
  if (error && typeof error === "object" && "issues" in error) return NextResponse.json({ error: "Request validation failed.", details: error }, { status: 422 });
  console.error("BuildRAX API failure", error instanceof Error ? { name: error.name, message: error.message } : "Unknown failure");
  return NextResponse.json({ error: "The request could not be completed safely." }, { status: 500 });
}
