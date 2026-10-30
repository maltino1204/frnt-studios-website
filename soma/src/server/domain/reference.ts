import "server-only";

/**
 * Human-readable codes. Alphabet without ambiguous characters (0/O, 1/I/L).
 * Booking references look like "SM-7KX4Q2"; start codes are 4 digits.
 */
export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERENCE_PATTERN = /^SM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export type RandomInt = (maxExclusive: number) => number;

const defaultRandom: RandomInt = (max) => {
  const buf = new Uint32Array(1);
  // Rejection sampling for an unbiased index.
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  for (;;) {
    globalThis.crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
};

export function randomCode(length: number, random: RandomInt = defaultRandom): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += REFERENCE_ALPHABET[random(REFERENCE_ALPHABET.length)];
  return out;
}

export function generateBookingReference(random: RandomInt = defaultRandom): string {
  return `SM-${randomCode(6, random)}`;
}

export function isBookingReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value.trim().toUpperCase());
}

export function normalizeReference(value: string): string {
  return value.trim().toUpperCase();
}

export function generateStartCode(random: RandomInt = defaultRandom): string {
  return String(random(10_000)).padStart(4, "0");
}

export function isStartCode(value: string): boolean {
  return /^\d{4}$/.test(value);
}
