import { routes } from "@/lib/routes";

/** Account sections (shared by the desktop rail and the mobile overview list). */
export const ACCOUNT_SECTIONS = [
  { href: routes.account.root(), label: "Übersicht" },
  { href: routes.account.bookings(), label: "Termine" },
  { href: routes.account.favorites(), label: "Favoriten" },
  { href: routes.account.addresses(), label: "Adressen" },
  { href: routes.account.profile(), label: "Profil & Sicherheit" },
  { href: routes.account.credits(), label: "Guthaben & Empfehlen" },
  { href: routes.account.notifications(), label: "Benachrichtigungen" },
];
