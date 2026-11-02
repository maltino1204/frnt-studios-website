"use client";

import { registerSurfaceLoader } from "./surfaces";

/*
 * The landing dialogs' code (chapter overlay, booking bar, booking sheet), registered for nav/surfaces.ts. This module
 * is imported by the page (hero/hero-booking-slot.tsx), so these `import()`s are chunked against the page's first
 * load: the booking entry, the kit sheet and the draft the dialogs share with the hero are not bundled a second time
 * into the dialogs' chunks (audit-2 RT-4, § 17.4).
 */
registerSurfaceLoader(() =>
  Promise.all([import("./chapter-overlay"), import("../booking/booking-bar"), import("../booking/booking-sheet")]).then(([o, b, s]) => ({
    ChapterOverlay: o.ChapterOverlay,
    BookingBar: b.BookingBar,
    BookingSheet: s.BookingSheet,
  })),
);
