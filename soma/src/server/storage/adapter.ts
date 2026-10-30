import "server-only";

import { getConfig } from "../config";
import { createLocalStorageAdapter } from "./local";
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
  readonly id: "local" | "supabase";
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  return getConfig().STORAGE_PROVIDER === "supabase" ? createSupabaseStorageAdapter() : createLocalStorageAdapter();
}
