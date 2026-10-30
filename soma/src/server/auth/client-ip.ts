import "server-only";

/**
 * Client IP from a trusted hop only (audit-1 R6).
 *   trustedHops = 0 → ignore X-Forwarded-For entirely; use the platform header
 *                     `x-real-ip` when present, otherwise "unknown".
 *   trustedHops = N → the N-th entry from the right of X-Forwarded-For (each
 *                     trusted proxy appends the address it saw); fewer entries
 *                     than N → "unknown".
 * "unknown" is not used as a rate-limit bucket (only the per-e-mail limits apply) —
 * configure TRUSTED_PROXY_HOPS or a platform that sets x-real-ip in production.
 */
export const UNKNOWN_IP = "unknown";

const IPV4 = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]{2,39}(?:%[0-9a-z]+)?$/i;

export function isIpAddress(value: string | null | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  return IPV4.test(v) || (v.includes(":") && IPV6.test(v));
}

export function clientIpFrom(get: (name: string) => string | null | undefined, trustedHops: number): string {
  const hops = Number.isFinite(trustedHops) ? Math.max(0, Math.floor(trustedHops)) : 0;
  if (hops === 0) {
    const real = get("x-real-ip")?.trim();
    return isIpAddress(real) ? real : UNKNOWN_IP;
  }
  const chain = (get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (chain.length < hops) return UNKNOWN_IP;
  const candidate = chain[chain.length - hops];
  return isIpAddress(candidate) ? candidate : UNKNOWN_IP;
}
