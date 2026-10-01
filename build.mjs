// Growthentic static site build. No dependencies: `node build.mjs` → dist/
// - Stitches shared partials (header, footer, WhatsApp button + cookie banner) into every page
// - Marks the current page in the nav
// - Injects site settings from site.config.json (WhatsApp, GA4, form endpoint)
// - Copies public/ as-is and writes sitemap.xml
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");
const config = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"));
const SITE = config.siteUrl.replace(/\/$/, "");

const partial = (name) => readFileSync(join(SRC, "partials", `${name}.html`), "utf8").trim();
const runtimeConfig = { whatsapp: config.whatsapp, gaId: config.gaId, formEndpoint: config.formEndpoint };
const scripts =
  `<script>window.GT_CONFIG=${JSON.stringify(runtimeConfig)};</script>` +
  `<script src="/assets/site.js" defer></script>`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, "public"), OUT, { recursive: true });

const pages = readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html")).sort();
const sitemap = [];
const today = new Date().toISOString().slice(0, 10);

for (const file of pages) {
  const slug = file.replace(/\.html$/, "");
  const path = slug === "index" ? "/" : `/${slug}`;
  let html = readFileSync(join(SRC, "pages", file), "utf8");

  // Header with the current page highlighted
  const header = partial("header").replace(
    new RegExp(`(<a href="${path.replace(/[/-]/g, "\\$&")}")(>)`),
    `$1 aria-current="page"$2`
  );

  html = html
    .replace("<!-- @include header -->", header)
    .replace("<!-- @include footer -->", partial("footer"))
    .replace("<!-- @include floating -->", partial("floating"))
    .replace("<!-- @include scripts -->", scripts);

  const leftover = html.match(/<!-- @include [a-z]+ -->/);
  if (leftover) throw new Error(`${file}: unknown include ${leftover[0]}`);

  writeFileSync(join(OUT, file), html);

  // Sitemap: every indexable page except legal pages and 404
  const noindex = /<meta name="robots" content="noindex/.test(html);
  if (!noindex && !["privacy", "terms", "404"].includes(slug)) {
    const mtime = statSync(join(SRC, "pages", file)).mtime.toISOString().slice(0, 10);
    const pri = slug === "index" ? "1.0" : ["blog", "marketing-check"].includes(slug) ? "0.9" : "0.7";
    const freq = ["index", "blog"].includes(slug) ? "weekly" : "monthly";
    sitemap.push(
      `  <url><loc>${SITE}${path}</loc><lastmod>${mtime || today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`
    );
  }
}

writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.join("\n")}\n</urlset>\n`
);

console.log(`Built ${pages.length} pages and sitemap (${sitemap.length} URLs) → dist/`);
