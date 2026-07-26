import { SITE } from "$lib/config";

export const prerender = true;

const pages = ["/"];
const locales = ["en", "ru"];

export function GET() {
  const base = SITE.url.replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];

  const urls = pages
    .map((page) => {
      const alternates = locales
        .map((locale) => {
          const href =
            locale === "en" ? `${base}${page}` : `${base}/${locale}${page}`;
          return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
        })
        .join("\n");

      return `  <url>
    <loc>${base}${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
${alternates}
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
