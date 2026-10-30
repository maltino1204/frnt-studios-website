import "server-only";

import { randomUUID } from "node:crypto";
import { withService } from "../db/client";
import type { Session } from "../dto";
import { ServiceError } from "../errors";
import { getStorageAdapter, type StoredObject } from "../storage/adapter";

/**
 * Upload validation and private/public media access.
 *   images:    jpeg/png/webp ≤ 8 MB   (portfolio, avatars — public)
 *   documents: pdf/jpeg/png  ≤ 10 MB  (verification documents — private: owner + admins)
 * The declared MIME type is not trusted: the file signature (magic bytes) decides.
 */

export interface UploadInput {
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}

export type MediaBucket = "portfolio" | "avatars" | "documents";

const MB = 1024 * 1024;
const LIMITS = { image: 8 * MB, document: 10 * MB } as const;

type Sniffed = { mime: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"; ext: "jpg" | "png" | "webp" | "pdf" };

export function sniffFileType(bytes: Uint8Array): Sniffed | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { mime: "image/png", ext: "png" };
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { mime: "image/webp", ext: "webp" };
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return { mime: "application/pdf", ext: "pdf" };
  return null;
}

export function validateUpload(file: UploadInput, kind: "image" | "document"): Sniffed {
  if (!file.bytes || file.bytes.length === 0) throw new ServiceError("validation", "Die Datei ist leer.", { file: "Keine Datei ausgewählt." });
  const limit = LIMITS[kind];
  if (file.bytes.length > limit) {
    throw new ServiceError("validation", `Die Datei ist zu groß (maximal ${limit / MB} MB).`, { file: `Maximal ${limit / MB} MB.` });
  }
  const sniffed = sniffFileType(file.bytes);
  const allowed = kind === "image" ? ["image/jpeg", "image/png", "image/webp"] : ["application/pdf", "image/jpeg", "image/png"];
  if (!sniffed || !allowed.includes(sniffed.mime)) {
    throw new ServiceError(
      "validation",
      kind === "image" ? "Bitte ein Bild im Format JPG, PNG oder WebP hochladen." : "Bitte ein PDF, JPG oder PNG hochladen.",
      { file: "Dateiformat nicht erlaubt." },
    );
  }
  return sniffed;
}

/** Stores a validated upload and returns its storage key. */
export async function storeUpload(bucket: MediaBucket, ownerId: string, file: UploadInput): Promise<{ key: string; mime: string; size: number }> {
  const sniffed = validateUpload(file, bucket === "documents" ? "document" : "image");
  const key = `${bucket}/${ownerId}/${randomUUID()}.${sniffed.ext}`;
  await getStorageAdapter().put(key, file.bytes, sniffed.mime);
  return { key, mime: sniffed.mime, size: file.bytes.length };
}

export async function deleteStoredFile(key: string | null | undefined): Promise<void> {
  if (!key || key.startsWith("/")) return; // static demo paths are not ours to delete
  try {
    await getStorageAdapter().delete(key);
  } catch (e) {
    console.error("[media] delete failed", key, e);
  }
}

const KEY_PATTERN = /^(portfolio|avatars|documents)\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/;

export interface MediaResponse extends StoredObject {
  isPublic: boolean;
}

/**
 * Authorised read. Public buckets: anyone. documents/<providerId>/…: only that
 * provider or an admin (role re-checked in the database).
 */
export async function readMedia(session: Session | null, key: string): Promise<MediaResponse> {
  const m = KEY_PATTERN.exec(key);
  if (!m) throw new ServiceError("not_found", "Datei nicht gefunden.");
  const [, bucket, ownerId] = m;
  const isPublic = bucket !== "documents";
  if (!isPublic) {
    if (!session) throw new ServiceError("unauthenticated", "Bitte melden Sie sich an.");
    if (session.userId !== ownerId) {
      // withService: authorisation lookup (is the caller an active admin?).
      const [row] = await withService((tx) => tx<{ role: string; blockedAt: Date | null }[]>`select role, blocked_at from public.profiles where id = ${session.userId}`);
      if (!row || row.role !== "admin" || row.blockedAt) throw new ServiceError("forbidden", "Kein Zugriff auf diese Datei.");
    }
  }
  const obj = await getStorageAdapter().get(key);
  if (!obj) throw new ServiceError("not_found", "Datei nicht gefunden.");
  return { ...obj, isPublic };
}
