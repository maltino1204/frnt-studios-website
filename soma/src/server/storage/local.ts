import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "../config";
import type { StorageAdapter } from "./adapter";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

/** Files under UPLOAD_DIR (default .data/uploads), served by /api/media with access checks. */
export function createLocalStorageAdapter(): StorageAdapter {
  // turbopackIgnore: uploads are runtime data, not part of the server bundle trace.
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), getConfig().UPLOAD_DIR);
  const resolve = (key: string) => {
    const full = path.resolve(/*turbopackIgnore: true*/ root, key);
    if (!full.startsWith(root + path.sep)) throw new Error("Ungültiger Speicherpfad");
    return full;
  };
  return {
    id: "local",
    async put(key, bytes) {
      const full = resolve(key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, bytes, { flag: "wx" });
    },
    async get(key) {
      try {
        const bytes = await readFile(resolve(key));
        const ext = key.split(".").pop() ?? "";
        return { bytes: new Uint8Array(bytes), contentType: TYPES[ext] ?? "application/octet-stream" };
      } catch {
        return null;
      }
    },
    async delete(key) {
      await rm(resolve(key), { force: true });
    },
  };
}
