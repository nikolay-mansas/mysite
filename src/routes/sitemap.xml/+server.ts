import { SITE } from "$lib/config";

export const prerender = true;

type ChangeFreq =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
type Locale = "en" | "ru";

type PageEntry = {
  path: string;
  changefreq: ChangeFreq;
  priority: number;
  lastmod?: string;
};

const LOCALES: readonly Locale[] = ["en", "ru"] as const;
const DEFAULT_LOCALE: Locale = "en";

const PAGES: readonly PageEntry[] = [
  { path: "/", changefreq: "monthly", priority: 1.0 },
  { path: "/tools", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/hash", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/encode", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/cipher", changefreq: "monthly", priority: 0.8 },
  { path: "/tools/hmac", changefreq: "monthly", priority: 0.8 },
  { path: "/tools/misc", changefreq: "monthly", priority: 0.7 },
] as const;

const BASE_URL = SITE.url.replace(/\/+$/, "");

function urlFor(locale: Locale, path: string): string {
  const isRoot = path === "/" || path === "";
  if (isRoot) {
    return locale === DEFAULT_LOCALE ? `${BASE_URL}/` : `${BASE_URL}/${locale}`;
  }
  return locale === DEFAULT_LOCALE
    ? `${BASE_URL}${path}`
    : `${BASE_URL}/${locale}${path}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function alternatesFor(path: string, indent = "    "): string {
  const lines = LOCALES.map(
    (l) =>
      `${indent}<xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(urlFor(l, path))}" />`,
  );
  lines.push(
    `${indent}<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(urlFor(DEFAULT_LOCALE, path))}" />`,
  );
  return lines.join("\n");
}

function urlEntry(locale: Locale, page: PageEntry, lastmod: string): string {
  const loc = escapeXml(urlFor(locale, page.path));
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${page.lastmod ?? lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
${alternatesFor(page.path)}
  </url>`;
}

export function GET() {
  const buildDate = new Date().toISOString().split("T")[0];

  const entries: string[] = [];
  for (const page of PAGES) {
    for (const locale of LOCALES) {
      entries.push(urlEntry(locale, page, buildDate));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
