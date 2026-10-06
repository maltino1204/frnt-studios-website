# Petite Paws · Website

The website for Petite Paws, Léa’s dog sitting service in Nice. It's a static site with no framework, no build step, no cookies and no third-party requests.

| File | What it is |
|---|---|
| `design-guidelines.html` | The design guideline, written first. Logo, colours, type, ornaments, motion, imagery, components, the review spec and tone of voice. |
| `index.html` | The website, in English and French. Visitors switch language with EN / FR. |
| `mentions-legales.html` | Legal notice and privacy. Placeholders are marked like this: **[à compléter]**. |
| `assets/css/tokens.css` | Every colour, size and tempo used on the site. Change it here only. |
| `assets/css/components.css`, `site.css`, `guide.css` | The shared components, the homepage sections and the guideline page. |
| `assets/js/core.js`, `site.js`, `guide.js` | Language, header and reveals; then the day scene, carousel and postcard; then the guideline demos. |
| `assets/img/` | The logo redrawn as a vector, the Riviera picture without its baked-in logo, crops, the OG image and icons. |
| `assets/fonts/` | Self-hosted fonts: Cormorant Garamond, Jost and Mrs Saint Delafield (all SIL Open Font License). |
| `tools/build-sprite.js` | Re-inlines the logo and icon sprite into the three pages. Run `node tools/build-sprite.js`. You only need it if the logo or icons change. |

## Preview

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Before going live

1. **Contact channels.** Instagram works today: the postcard form copies the message and opens a chat with @lepetitepaws. To show e-mail and WhatsApp buttons as well, add them to `CONTACT` at the top of `assets/js/site.js`.
2. **Domain.** Once the domain is known, make `og:image` absolute in `index.html` and add `<link rel="canonical">`. If French search matters, consider a separate `/fr/` page.
3. **Legal page.** Fill in every placeholder in `mentions-legales.html`: publisher, SIRET, address, host, e-mail and consumer mediator.

## For Léa to confirm

Nothing on the site is invented, but a few points are inferred from the reviews and need a yes from Léa:

- [ ] **“Holidays at Léa’s”**: dogs can also stay at Léa’s home. This is inferred from review 2 (« Quand je l’ai récupéré ») and review 6.
- [ ] **A meet & greet before a stay** is offered. This is inferred from review 1 (“we were able to make introductions very easily”).
- [ ] **Area: “Nice & surroundings”.**
- [ ] **Cats are welcome**, on request. This is inferred from review 1 (Cleo).
- [ ] **Day care and walks** are offered as separate services. This is inferred from reviews 3 and 5.
- [ ] **Review 5 (David B.)**: the screenshot cuts three words at its right edge. They were completed as “about”, “the” and “again.” Please check them against the original.
- [ ] **Reviews 1 to 3**: the screenshots don't show the reviewers’ names or dates, so the cards show none. If Léa sends them, they can be added in the same format as reviews 4 to 6.
- [ ] **Photos.** The site uses the one Riviera picture and crops of it. Real photos of client dogs (with the owners’ permission) would make the site even more personal. The guideline explains how to use them, in L’Arche and Le Timbre.
