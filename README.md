# Growthentic.eu

Static marketing site for Growthentic. Plain HTML + one CSS file + one JS file. No framework, no npm dependencies.
Hosted on Vercel (same setup as datadrivify.com). Forms go to Formspree.

## Structure

```
src/pages/        One file per page (index, services, pricing, ... 404). Edit page content here.
src/partials/     Shared blocks stitched into every page:
                  header.html (logo + nav), footer.html, floating.html (WhatsApp button + cookie banner)
public/           Copied to the site root unchanged: assets/style.css, assets/site.js, favicon, OG image, robots.txt
site.config.json  WhatsApp link, GA4 ID, Formspree endpoint (injected into every page at build)
build.mjs         Build script → dist/  (also generates sitemap.xml)
vercel.json       Clean URLs (/pricing, not /pricing.html), security headers, asset caching
```

Pages use `<!-- @include header -->`, `<!-- @include footer -->`, `<!-- @include floating -->` and
`<!-- @include scripts -->`. The current page is highlighted in the nav automatically.

## Run locally

```
node build.mjs          # writes dist/
npx serve dist          # preview at http://localhost:3000 (clean URLs work)
```

## Go-live checklist

1. **GitHub**: push this folder to a new repo (e.g. `growthentic-site`).
2. **Vercel**: Add New → Project → import the repo. Framework preset "Other". Build/output settings are read from `vercel.json`, nothing to fill in.
3. **Domain**: Vercel → Project → Settings → Domains → add `growthentic.eu` and `www.growthentic.eu` (set www to redirect to the apex).
   At the .eu registrar: `A  @  76.76.21.21` and `CNAME  www  cname.vercel-dns.com` (use the exact values Vercel shows).
   Leave any MX / email records untouched.
4. **Forms (Formspree)**: create a form at formspree.io, copy its endpoint (`https://formspree.io/f/xxxxxxx`) into
   `formEndpoint` in `site.config.json`, commit, push. Until this is set, all three forms open WhatsApp with the visitor's
   details pre-filled, so no lead is lost. Each submission includes a `form` field (home / contact / audit) and the `page` path.
   In Formspree, add `growthentic.eu` under the form's allowed domains.
5. **Analytics**: put the GA4 measurement ID (`G-XXXXXXX`) in `gaId`. It only loads after a visitor accepts analytics cookies (GDPR).
6. **Search Console**: verify the domain and submit `https://growthentic.eu/sitemap.xml`.

## Adding a page

Copy an existing file in `src/pages/` (e.g. `about.html`) to `src/pages/new-page.html`, change the `<title>`, description,
canonical (`https://growthentic.eu/new-page`), OG tags and the `<main>` content. It is added to the sitemap automatically.
To show it in the nav or footer, edit `src/partials/header.html` / `footer.html` once.

## Still to add (from the original brief)

- LinkedIn company page and legal entity details in the footer
- Real case studies: the proof section on the home page is built but `hidden` (`#proof`)
- Blog posts
