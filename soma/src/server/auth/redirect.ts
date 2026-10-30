import "server-only";

/**
 * Open-redirect guard for `?next=` (audit-1 R2). Accepts only same-origin
 * relative paths: exactly one leading "/", no "//" or "/\", no control
 * characters or backslashes (raw or percent-encoded), and the resolved URL
 * must have the app's origin. Returns the normalised path or null.
 */
const CONTROL_OR_BACKSLASH = /[\u0000-\u001F\u007F\\]/;
const ENCODED_CONTROL_OR_BACKSLASH = /%(?:[01][0-9a-f]|7f|5c)/i;

export function safeRelativePath(next: unknown, appUrl: string): string | null {
  if (typeof next !== "string" || next.length === 0 || next.length > 2048) return null;
  if (CONTROL_OR_BACKSLASH.test(next) || ENCODED_CONTROL_OR_BACKSLASH.test(next)) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  let base: URL;
  let resolved: URL;
  try {
    base = new URL(appUrl);
    resolved = new URL(next, base);
  } catch {
    return null;
  }
  if (resolved.origin !== base.origin) return null;
  // Dot segments can collapse into a protocol-relative path ("/.//evil.example" → "//evil.example"),
  // which a browser would treat as another host (audit-3 F1). Reject any normalised path that
  // starts with two slashes or contains a backslash.
  if (resolved.pathname.startsWith("//") || resolved.pathname.includes("\\")) return null;
  // An encoded slash right after the first one ("/./%2Fevil") is decoded by some proxies into "//evil".
  if (/^\/%2f/i.test(resolved.pathname)) return null;
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
