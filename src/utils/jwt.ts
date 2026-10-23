function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** JWT `exp` in seconds since epoch, or null if missing / undecodable. */
export function getJwtExpirySeconds(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
}

/** Same rule as ossem-frontend: missing exp or exp < now → treat as expired. */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const expiry = getJwtExpirySeconds(token);
  if (!expiry) return true;
  return expiry < Date.now() / 1000;
}
