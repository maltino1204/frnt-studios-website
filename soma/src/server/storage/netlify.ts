import "server-only";

import { getStore } from "@netlify/blobs";
import type { StorageAdapter } from "./adapter";

/**
 * Netlify Blobs adapter (STORAGE_PROVIDER=netlify) for deployments on Netlify, whose function
 * file system is read-only. One store, keys unchanged (`<bucket>/<ownerId>/<file>`); access
 * checks stay in /api/media. Works inside Netlify Functions without credentials.
 * NOT COVERED BY AUTOMATED TESTS (needs the Netlify runtime).
 */
export function createNetlifyStorageAdapter(): StorageAdapter {
  const store = () => getStore({ name: "soma-uploads", consistency: "strong" });
  return {
    id: "netlify",
    async put(key, bytes, contentType) {
      const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      await store().set(key, data, { metadata: { contentType } });
    },
    async get(key) {
      const res = await store().getWithMetadata(key, { type: "arrayBuffer" });
      if (!res) return null;
      const contentType = typeof res.metadata.contentType === "string" ? res.metadata.contentType : "application/octet-stream";
      return { bytes: new Uint8Array(res.data), contentType };
    },
    async delete(key) {
      await store().delete(key);
    },
  };
}
