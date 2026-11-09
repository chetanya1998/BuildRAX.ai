import "server-only";

import { createHash } from "node:crypto";
import { ServiceUnavailableError } from "./http";

export function hashShareToken(token: string) {
  const pepper = process.env.SHARE_TOKEN_PEPPER;
  if (process.env.NODE_ENV === "production" && !pepper) {
    throw new ServiceUnavailableError("SHARE_TOKEN_PEPPER is not configured.");
  }
  return createHash("sha256").update(`${token}:${pepper ?? "local-development-only"}`).digest("hex");
}
