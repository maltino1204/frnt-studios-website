import "server-only";

/**
 * Client IP from an explicitly trusted source only (audit-1 R6, audit-2 N2).
 *
 *   TRUSTED_IP_HEADER=<name>  a header the hosting platform sets/overwrites itself
 *                             (e.g. `x-vercel-forwarded-for`, `cf-connecting-ip`,
 *                             `x-real-ip` behind nginx with `proxy_set_header`).
 *                             The first entry of the header is used.
 *   TRUSTED_PROXY_HOPS=N      alternative: the N-th X-Forwarded-For entry from the
 *                             right (each trusted proxy appends the address it saw).
 *   neither                   no client-supplied header is used at all → "unknown".
 *
 * "unknown" is not used as an IP bucket (one shared bucket would let one client lock
 * everybody out); the per-e-mail limits and the global failure budget still apply.
 * `npm run check:launch` blocks a production env that configures neither.
 */
export const UNKNOWN_IP = "unknown";

const IPV4 = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]{2,39}(?:%[0-9a-z]+)?$/i;
const HEADER_NAME = /^[a-z0-9-]{1,64}$/;

export interface IpTrust {
  /** lower-case header name set by the platform, or null */
  header?: string | null;
  /** number of trusted proxies appending to X-Forwarded-For (0 = none) */
  hops?: number;
}

export function isIpAddress(value: string | null | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  return IPV4.test(v) || (v.includes(":") && IPV6.test(v));
}

/** Strips an IPv4 port ("203.0.113.7:4711") and IPv6 brackets ("[2001:db8::1]:443"). */
function normalise(raw: string): string {
  const v = raw.trim();
  const bracketed = /^\[([0-9a-f:]+)\](?::\d+)?$/i.exec(v);
  if (bracketed) return bracketed[1];
  const v4port = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(v);
  return v4port ? v4port[1] : v;
}

export function clientIpFrom(get: (name: string) => string | null | undefined, trust: IpTrust): string {
  const header = trust.header?.trim().toLowerCase();
  if (header && HEADER_NAME.test(header)) {
    const first = normalise((get(header) ?? "").split(",")[0] ?? "");
    return isIpAddress(first) ? first : UNKNOWN_IP;
  }
  const hops = Number.isFinite(trust.hops) ? Math.max(0, Math.floor(trust.hops ?? 0)) : 0;
  if (hops === 0) return UNKNOWN_IP;
  const chain = (get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (chain.length < hops) return UNKNOWN_IP;
  const candidate = normalise(chain[chain.length - hops]);
  return isIpAddress(candidate) ? candidate : UNKNOWN_IP;
}

/** true when the deployment tells us where the client IP comes from */
export function ipTrustConfigured(trust: IpTrust): boolean {
  return Boolean(trust.header && HEADER_NAME.test(trust.header.trim().toLowerCase())) || (trust.hops ?? 0) > 0;
}
