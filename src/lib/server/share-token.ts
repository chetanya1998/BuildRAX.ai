import "server-only";

import { createHash } from "node:crypto";

export function hashShareToken(token: string) {
  const pepper = process.env.SHARE_TOKEN_PEPPER;
  if (process.env.NODE_ENV === "production" && !pepper) {
    throw new Error("Share links are not configured.");
  }
  return createHash("sha256").update(`${token}:${pepper ?? "local-development-only"}`).digest("hex");
}
