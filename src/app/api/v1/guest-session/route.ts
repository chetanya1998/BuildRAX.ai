import { NextResponse } from "next/server";
import { apiError } from "@/lib/server/http";
import { issueGuestIdentity } from "@/lib/server/request-identity";

export async function POST() {
  try {
    const identity = issueGuestIdentity();
    return NextResponse.json(identity, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
