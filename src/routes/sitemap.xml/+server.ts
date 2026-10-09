import { SITE } from "$lib/config";

export const prerender = true;

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

type PageEntry = {
  path: string;
  changefreq: ChangeFreq;
  priority: number;
  lastmod?: string;
};

const pages: PageEntry[] = [
  { path: "/", changefreq: "monthly", priority: 1.0 },

  { path: "/tools", changefreq: "monthly", priority: 0.9 },

  { path: "/tools/hash",   changefreq: "monthly", priority: 0.9 },
  { path: "/tools/encode", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/cipher", changefreq: "monthly", priority: 0.8 },
  { path: "/tools/hmac",   changefreq: "monthly", priority: 0.8 },
  { path: "/tools/misc",   changefreq: "monthly", priority: 0.7 },
];

const locales = ["en", "ru"] as const;
const DEFAULT_LOCALE = "en";

export function GET() {
  const base = SITE.url.replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];

  const urls = pages
    .map(({ path, changefreq, priority, lastmod }) => {
      const clean = path === "" || path === "/" ? "/" : path.replace(/\/+$/, "");

      const locFor = (locale: string) =>
        locale === DEFAULT_LOCALE
          ? `${base}${clean}`
          : `${base}/${locale}${clean}`;

      const loc = locFor(DEFAULT_LOCALE);

      const alternates = [
        ...locales.map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l}" href="${locFor(l)}" />`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${locFor(DEFAULT_LOCALE)}" />`,
      ].join("\n");

      const lastmodLine = `    <lastmod>${lastmod ?? today}</lastmod>`;

      return `  <url>
    <loc>${loc}</loc>
${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
${alternates}
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}