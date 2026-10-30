/** Minimal PDF used for the demo seed's verification documents (and served for them on hosted demos). */
export const DEMO_PLACEHOLDER_PDF = new Uint8Array(
  Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n% SOMA Demo-Dokument (Platzhalter)\n",
  ),
);
