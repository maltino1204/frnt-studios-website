/**
 * The landing's addition to the shared footer (spec § 4.10 "Footer"): the AI disclosure for the page's imagery, and
 * room under the legal row for the mobile dock. Rendered after <SiteFooter/> on the same Linen (the shared footer
 * takes no extra line yet; a `note` prop there would let this move into its base row).
 */
export function FooterNote() {
  return (
    <div className="lp-footnote bg-surface-sunken">
      <div className="lp-container">
        <p className="type-caption text-ink-muted">Bilder: KI-generierte Entwicklungsassets</p>
      </div>
    </div>
  );
}
