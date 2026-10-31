import { NextResponse, type NextRequest } from "next/server";
import { BOOKING_STATUS, PROVIDER_STATUS, ROLE } from "@/components/admin/labels";
import { formatDate, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { authorize } from "@/server/auth/guards";
import { listProvidersAdmin } from "@/server/services/admin";
import { listAdminBookingsFiltered, listUsersFiltered } from "@/server/services/admin-ext";

export type PaletteHit = { id: string; href: string; title: string; sub: string; kind: "booking" | "provider" | "user"; reference?: string };
export type PaletteResults = { q: string; bookings: PaletteHit[]; providers: PaletteHit[]; users: PaletteHit[] };

/**
 * Quick search for the admin command palette (⌘K): up to five bookings, providers and
 * accounts for a query of 2–60 characters. Admin only; never cached.
 */
export async function GET(request: NextRequest) {
  const headers = { "cache-control": "no-store" };
  let session;
  try {
    session = await authorize("admin");
  } catch {
    return NextResponse.json({ error: "Dafür fehlt die Berechtigung." }, { status: 403, headers });
  }
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ q, bookings: [], providers: [], users: [] } satisfies PaletteResults, { headers });

  const [bookings, providers, users] = await Promise.all([
    listAdminBookingsFiltered(session, { q, page: 1, pageSize: 5 }).catch(() => null),
    listProvidersAdmin(session, { q, page: 1, pageSize: 5 }).catch(() => null),
    listUsersFiltered(session, { q, page: 1, pageSize: 5 }).catch(() => null),
  ]);

  const body: PaletteResults = {
    q,
    bookings: (bookings?.items ?? []).map((b) => ({
      id: b.id,
      kind: "booking",
      href: routes.admin.booking(b.id),
      reference: b.reference,
      title: b.serviceName,
      sub: `${formatDate(b.startsAt)} ${formatTime(b.startsAt)} · ${b.customerName} ↔ ${b.providerName} · ${BOOKING_STATUS[b.status].label}`,
    })),
    providers: (providers?.items ?? []).map((p) => ({
      id: p.providerId,
      kind: "provider",
      href: routes.admin.provider(p.providerId),
      title: p.displayName,
      sub: PROVIDER_STATUS[p.status].label,
    })),
    users: (users?.items ?? []).map((u) => ({
      id: u.id,
      kind: "user",
      href: `/admin/nutzer/${u.id}`,
      title: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
      sub: `${ROLE[u.role]} · ${u.email}`,
    })),
  };
  return NextResponse.json(body, { headers });
}
