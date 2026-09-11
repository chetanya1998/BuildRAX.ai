const DEFAULT_RETURN_PATH = "/dashboard";

/** Only allow same-application paths to cross the authentication boundary. */
export function safeAuthReturnPath(value: string | null | undefined, fallback = DEFAULT_RETURN_PATH) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, "https://buildrax.local");
    if (parsed.origin !== "https://buildrax.local" || parsed.pathname === "/auth/callback") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function signInPath(next: string) {
  return `/sign-in?next=${encodeURIComponent(safeAuthReturnPath(next))}`;
}
