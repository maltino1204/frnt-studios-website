import "server-only";

import { z } from "zod";
import { withService, withUser, type Queryable } from "../db/client";
import type { CancellationPolicyDTO, Paginated, PortfolioItemDTO, ProviderBookingDTO, RequiredDocumentDTO, Session } from "../dto";
import { loadSettings, mediaUrl, paging, parse, policyToDTO, requireRoleIn } from "./_shared";
import { runBookingMaintenanceLazily } from "./booking-maintenance";
import { queryProviderBookings, toProviderBooking } from "./bookings";

/**
 * Provider app extensions (Agent 5a, minimal): reads the provider UI needs that
 * services/pro.ts and services/bookings.ts do not expose yet.
 *
 *  - listProBookingsTab / countProBookingTabs: the four "Termine" tabs
 *    (Anfragen · Bevorstehend · Vergangen · Storniert) with correct paging.
 *  - listMyPortfolio: the provider's own portfolio (also while not approved).
 *  - getProviderTerms: public launch terms for /fuer-profis (commission tiers,
 *    payout hold, platform-wide required documents).
 */

export type ProBookingTab = "requests" | "upcoming" | "past" | "cancelled";

const zTab = z.enum(["requests", "upcoming", "past", "cancelled"]);

function tabCondition(t: Queryable, tab: ProBookingTab) {
  switch (tab) {
    case "requests":
      return t`status = 'requested'`;
    case "upcoming":
      // includes appointments that have ended but still wait for "Abschließen"
      return t`status in ('confirmed', 'in_progress')`;
    case "past":
      return t`status in ('completed', 'no_show')`;
    case "cancelled":
      return t`status in ('cancelled', 'declined', 'expired')`;
  }
}

export async function listProBookingsTab(session: Session, tab: ProBookingTab, page = 1, pageSize = 20): Promise<Paginated<ProviderBookingDTO>> {
  const s = requireRoleIn(session, "provider");
  const f = parse(zTab, tab);
  const pg = paging(page, pageSize, 20);
  await runBookingMaintenanceLazily();
  return withUser(s.userId, async (tx) => {
    const asc = f === "requests" || f === "upcoming";
    const rows = await queryProviderBookings(tx, (t) => t`where ${tabCondition(t, f)} order by starts_at ${asc ? t`asc` : t`desc`} limit ${pg.pageSize} offset ${pg.offset}`);
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.provider_bookings where ${tabCondition(tx, f)}`;
    const now = new Date();
    return { items: rows.map((r) => toProviderBooking(r, now)), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export async function countProBookingTabs(session: Session): Promise<Record<ProBookingTab, number>> {
  const s = requireRoleIn(session, "provider");
  return withUser(s.userId, async (tx) => {
    const [r] = await tx<Record<ProBookingTab, number>[]>`
      select count(*) filter (where status = 'requested')::int as requests,
             count(*) filter (where status in ('confirmed', 'in_progress'))::int as upcoming,
             count(*) filter (where status in ('completed', 'no_show'))::int as past,
             count(*) filter (where status in ('cancelled', 'declined', 'expired'))::int as cancelled
      from public.provider_bookings`;
    return r;
  });
}

export async function listMyPortfolio(session: Session): Promise<PortfolioItemDTO[]> {
  const s = requireRoleIn(session, "provider");
  return withUser(s.userId, async (tx) => {
    const rows = await tx<{ id: string; storagePath: string; caption: string | null; categoryId: string | null; sortOrder: number }[]>`
      select id, storage_path, caption, category_id, sort_order from public.provider_portfolio
      where provider_id = ${s.userId} order by sort_order, created_at`;
    return rows.map((r) => ({ id: r.id, url: mediaUrl(r.storagePath) ?? "", caption: r.caption, categoryId: r.categoryId, sortOrder: r.sortOrder }));
  });
}

export interface ProviderTermsDTO {
  /** global commission rule (fractions, e.g. 0.2) */
  commission: { rate: number; repeatClientRate: number; ownClientRate: number } | null;
  payoutHoldHours: number;
  requestResponseHours: number;
  baseRequiredDocuments: RequiredDocumentDTO[];
  cancellationPolicy: CancellationPolicyDTO;
}

/** Public launch terms for the provider acquisition page (commission, payout hold, documents, cancellation policy). */
export async function getProviderTerms(): Promise<ProviderTermsDTO> {
  // withService: commission_rules and platform_settings are admin-only under RLS; only the
  // active global rule's three rates and non-sensitive settings are returned (public terms).
  return withService(async (tx) => {
    const settings = await loadSettings(tx);
    const [rule] = await tx<{ rate: string; repeatClientRate: string; ownClientRate: string }[]>`
      select rate::text as rate, repeat_client_rate::text as repeat_client_rate, own_client_rate::text as own_client_rate
      from public.commission_rules where scope = 'global' and is_active limit 1`;
    return {
      commission: rule ? { rate: Number(rule.rate), repeatClientRate: Number(rule.repeatClientRate), ownClientRate: Number(rule.ownClientRate) } : null,
      payoutHoldHours: settings.payoutHoldHours,
      requestResponseHours: settings.requestResponseHours,
      baseRequiredDocuments: settings.baseRequiredDocuments,
      cancellationPolicy: policyToDTO(settings.cancellationPolicy),
    };
  });
}
