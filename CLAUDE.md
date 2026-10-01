# Growthentic site: notes for Claude

- Static site. Edit `src/pages/*.html` and `src/partials/*.html`, never `dist/` (build output, gitignored).
- Shared header/footer/WhatsApp/cookie banner live in `src/partials/`. Change once, applies everywhere.
- Settings (WhatsApp, GA4, Formspree) live only in `site.config.json`.
- Internal links are root-relative clean URLs: `/pricing`, `/services#ads`, `/assets/style.css`. No `.html` in links or canonicals.
- Contact is WhatsApp and phone only (+370 632 36893). Never add an email address to the site.
- Keep "SMBs" with a lowercase s (the `.lc` span in the home eyebrow exists for this).
- Do not add sample or invented results/testimonials. The `#proof` section stays hidden until real case studies with results exist.
- Client work lives on `/work` (src/pages/work.html) and the home `#clients` section. Never mention DataDrivify anywhere on the site.
- Do not name individual team members on the About page; it shows combined experience only.
- After edits run `node build.mjs`; it fails loudly on an unknown include.
