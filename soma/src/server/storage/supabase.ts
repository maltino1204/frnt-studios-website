import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getConfig } from "../config";
import type { StorageAdapter } from "./adapter";

/**
 * Supabase Storage adapter (production). NOT COVERED BY AUTOMATED TESTS:
 * needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and the buckets
 * `portfolio`, `avatars` (public) and `documents` (private). Access checks
 * stay in /api/media; the service-role key never leaves the server.
 */
function split(key: string): { bucket: string; path: string } {
  const [bucket, ...rest] = key.split("/");
  return { bucket, path: rest.join("/") };
}

export function createSupabaseStorageAdapter(): StorageAdapter {
  const cfg = getConfig();
  if (!cfg.NEXT_PUBLIC_SUPABASE_URL || !cfg.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("STORAGE_PROVIDER=supabase benötigt NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.");
  }
  const client = createClient(cfg.NEXT_PUBLIC_SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return {
    id: "supabase",
    async put(key, bytes, contentType) {
      const { bucket, path } = split(key);
      const { error } = await client.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
      if (error) throw new Error(`Upload fehlgeschlagen: ${error.message}`);
    },
    async get(key) {
      const { bucket, path } = split(key);
      const { data, error } = await client.storage.from(bucket).download(path);
      if (error || !data) return null;
      return { bytes: new Uint8Array(await data.arrayBuffer()), contentType: data.type || "application/octet-stream" };
    },
    async delete(key) {
      const { bucket, path } = split(key);
      await client.storage.from(bucket).remove([path]);
    },
  };
}
