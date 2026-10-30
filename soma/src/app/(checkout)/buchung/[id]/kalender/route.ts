import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/server/auth/guards";
import { getBookingForCustomer } from "@/server/services/bookings";
import { BRAND_NAME, SITE_URL } from "@/lib/brand";
import { routes } from "@/lib/routes";

/** .ics for one booking (customer-owned, requested or confirmed). Never contains the Start-Code. */
function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
}
/** RFC 5545 line folding at 75 octets. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest, "utf8") > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut), "utf8") > 75) cut -= 1;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return NextResponse.redirect(new URL(routes.login(routes.booking(id)), request.url));
  }
  const b = await getBookingForCustomer(session, id).catch(() => null);
  if (!b || !["requested", "confirmed", "in_progress", "pending_payment"].includes(b.status)) {
    return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  }
  const url = `${SITE_URL}${routes.booking(b.id)}`;
  const location = `${b.location.addressLine}, ${b.location.postalCode} ${b.location.city}`;
  const description = [
    `${b.serviceName} (${b.durationMinutes} Min.) mit ${b.provider.displayName}${b.provider.displayName.endsWith(".") ? "" : "."}`,
    b.status === "requested" ? "Status: angefragt – noch nicht bestätigt." : "Status: bestätigt.",
    `Buchung ${b.reference}. Ihren Start-Code finden Sie in der Buchung: ${url}`,
  ].join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND_NAME}//Buchung//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@soma`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(b.startsAt)}`,
    `DTEND:${icsDate(b.endsAt)}`,
    `SUMMARY:${esc(`${b.serviceName} mit ${b.provider.displayName}`)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(description)}`,
    `URL:${url}`,
    `STATUS:${b.status === "confirmed" || b.status === "in_progress" ? "CONFIRMED" : "TENTATIVE"}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${b.serviceName} in einer Stunde`)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="soma-${b.reference}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
