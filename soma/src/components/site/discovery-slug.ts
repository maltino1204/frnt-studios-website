/** URL slugs as used by categories and cities; anything else is a 404 without a DB round trip. */
export function isSlug(s: string): boolean {
  return /^[a-z0-9-]{1,60}$/.test(s);
}
