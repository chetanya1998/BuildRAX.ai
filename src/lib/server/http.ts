import { NextResponse } from "next/server";

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
  constructor(public status: number, message: string) { super(message); }
}

export function apiError(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "issues" in error) return NextResponse.json({ error: "Request validation failed.", details: error }, { status: 422 });
  console.error("BuildRAX API failure", error instanceof Error ? { name: error.name, message: error.message } : "Unknown failure");
  return NextResponse.json({ error: "The request could not be completed safely." }, { status: 500 });
}
