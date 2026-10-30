import { getSession } from "@/server/auth/session";
import { isServiceError } from "@/server/errors";
import { readMedia } from "@/server/services/media";

/**
 * GET /api/media/<bucket>/<ownerId>/<file>
 * Public buckets (portfolio, avatars) for everyone; documents only for the
 * owning provider and admins. Never cached when private.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await ctx.params;
  const key = path.join("/");
  try {
    const isPrivate = key.startsWith("documents/");
    const media = await readMedia(isPrivate ? await getSession() : null, key);
    const headers = new Headers({
      "Content-Type": media.contentType,
      "Content-Length": String(media.bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": media.isPublic ? "public, max-age=86400, immutable" : "private, no-store",
    });
    if (!media.isPublic) {
      headers.set("Content-Disposition", "inline");
      headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    }
    return new Response(Buffer.from(media.bytes), { status: 200, headers });
  } catch (e) {
    if (isServiceError(e)) {
      const status = e.code === "unauthenticated" ? 401 : e.code === "forbidden" ? 403 : 404;
      return Response.json({ error: e.message }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[media] read failed", e);
    return Response.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
