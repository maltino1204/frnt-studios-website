import "server-only";

import { getConfig } from "../config";
import { createLocalStorageAdapter } from "./local";
import { createNetlifyStorageAdapter } from "./netlify";
import { createSupabaseStorageAdapter } from "./supabase";

/**
 * StorageAdapter. Keys look like `<bucket>/<ownerId>/<uuid>.<ext>` with the
 * buckets `portfolio` and `avatars` (public) and `documents` (private).
 */
export interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

export interface StorageAdapter {
  readonly id: "local" | "supabase" | "netlify";
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  switch (getConfig().STORAGE_PROVIDER) {
    case "supabase":
      return createSupabaseStorageAdapter();
    case "netlify":
      return createNetlifyStorageAdapter();
    default:
      return createLocalStorageAdapter();
  }
}
