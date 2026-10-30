import { clsx, type ClassValue } from "clsx";

/** Compose class names. Tailwind conflicts are avoided by design (no override-heavy APIs). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
