import { NextResponse } from "next/server";
import { apiError } from "@/lib/server/http";
import { GUEST_IDENTITY_COOKIE, issueGuestIdentity, verifyGuestIdentity } from "@/lib/server/request-identity";

function existingGuestToken(request: Request) {
  const prefix = `${GUEST_IDENTITY_COOKIE}=`;
  const value = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!value) return null;
  try { return decodeURIComponent(value.slice(prefix.length)); }
  catch { return null; }
}

export async function POST(request: Request) {
  try {
    const existing = existingGuestToken(request);
    let identity: ReturnType<typeof issueGuestIdentity>;
    if (existing) {
      try {
        const verified = verifyGuestIdentity(existing);
        identity = { token: existing, expiresAt: verified.expiresAt };
      } catch {
        identity = issueGuestIdentity();
      }
    } else {
      identity = issueGuestIdentity();
    }
    const response = NextResponse.json({ expiresAt: identity.expiresAt }, {
      status: existing === identity.token ? 200 : 201,
      headers: { "cache-control": "no-store" },
    });
    response.cookies.set(GUEST_IDENTITY_COOKIE, identity.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(identity.expiresAt),
    });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
