import { SITE } from "$lib/config";
import { getAllPosts } from "$lib/blog/posts";

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

type BlogEntry = {
  lang: Locale;
  slug: string;
  lastmod: string;
  translations: Partial<Record<Locale, string>>;
};

const LOCALES: readonly Locale[] = ["en", "ru"] as const;
const DEFAULT_LOCALE: Locale = "en";

const STATIC_PAGES: readonly PageEntry[] = [
  { path: "/", changefreq: "monthly", priority: 1.0 },
  { path: "/blog", changefreq: "weekly", priority: 0.9 },
  { path: "/tools", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/hash", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/encode", changefreq: "monthly", priority: 0.9 },
  { path: "/tools/cipher", changefreq: "monthly", priority: 0.8 },
  { path: "/tools/hmac", changefreq: "monthly", priority: 0.8 },
  { path: "/tools/uuid", changefreq: "monthly", priority: 0.7 },
];

const BASE_URL = SITE.url.replace(/\/+$/, "");

function toW3CDate(value: string | Date | undefined | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function urlFor(locale: Locale, path: string): string {
  const isRoot = path === "/" || path === "";
  if (isRoot) {
    return locale === DEFAULT_LOCALE ? `${BASE_URL}/` : `${BASE_URL}/${locale}`;
  }
  return locale === DEFAULT_LOCALE
    ? `${BASE_URL}${path}`
    : `${BASE_URL}/${locale}${path}`;
}

function blogUrlFor(lang: Locale, slug: string): string {
  return lang === DEFAULT_LOCALE
    ? `${BASE_URL}/blog/${slug}`
    : `${BASE_URL}/${lang}/blog/${slug}`;
}

type PostMeta = {
  lang: Locale;
  slug: string;
  date: string | Date;
  updated?: string | Date;
};

function buildBlogEntries(): BlogEntry[] {
  const all = getAllPosts();
  const posts = all.filter((p) =>
    (LOCALES as readonly string[]).includes(p.lang),
  ) as PostMeta[];

  const bySlug = new Map<
    string,
    Map<Locale, { date: string | Date; updated?: string | Date }>
  >();

  for (const p of posts) {
    const bucket = bySlug.get(p.slug) ?? new Map();
    const existing = bucket.get(p.lang);

    const incomingDate = p.updated ?? p.date;
    const existingDate = existing ? (existing.updated ?? existing.date) : null;

    if (
      !existing ||
      !existingDate ||
      new Date(existingDate).getTime() < new Date(incomingDate).getTime()
    ) {
      bucket.set(p.lang, { date: p.date, updated: p.updated });
    }

    bySlug.set(p.slug, bucket);
  }

  const entries: BlogEntry[] = [];

  for (const [slug, langs] of bySlug) {
    const translations: Partial<Record<Locale, string>> = {};
    for (const lang of langs.keys()) translations[lang] = slug;

    for (const [lang, meta] of langs) {
      const w3c = toW3CDate(meta.updated ?? meta.date);
      if (!w3c) continue;

      entries.push({
        lang,
        slug,
        lastmod: w3c,
        translations,
      });
    }
  }

  entries.sort((a, b) =>
    a.lang === b.lang
      ? a.slug.localeCompare(b.slug)
      : a.lang.localeCompare(b.lang),
  );

  return entries;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function staticAlternates(path: string, indent = "    "): string {
  const lines = LOCALES.map(
    (l) =>
      `${indent}<xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(urlFor(l, path))}" />`,
  );
  lines.push(
    `${indent}<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(urlFor(DEFAULT_LOCALE, path))}" />`,
  );
  return lines.join("\n");
}

function blogAlternates(
  translations: Partial<Record<Locale, string>>,
  indent = "    ",
): string {
  const lines: string[] = [];

  for (const l of LOCALES) {
    const slug = translations[l];
    if (!slug) continue;
    lines.push(
      `${indent}<xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(blogUrlFor(l, slug))}" />`,
    );
  }

  const defaultLang: Locale | undefined =
    translations[DEFAULT_LOCALE] !== undefined
      ? DEFAULT_LOCALE
      : LOCALES.find((l) => translations[l] !== undefined);

  if (defaultLang) {
    const defaultSlug = translations[defaultLang]!;
    lines.push(
      `${indent}<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(blogUrlFor(defaultLang, defaultSlug))}" />`,
    );
  }

  return lines.join("\n");
}

function staticUrlEntry(
  page: PageEntry,
  locale: Locale,
  buildDate: string,
): string {
  const loc = escapeXml(urlFor(locale, page.path));
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${page.lastmod ?? buildDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
${staticAlternates(page.path)}
  </url>`;
}

function blogUrlEntry(post: BlogEntry): string {
  const loc = escapeXml(blogUrlFor(post.lang, post.slug));
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${blogAlternates(post.translations)}
  </url>`;
}

export function GET() {
  const buildDate = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  for (const page of STATIC_PAGES) {
    for (const locale of LOCALES) {
      entries.push(staticUrlEntry(page, locale, buildDate));
    }
  }

  for (const post of buildBlogEntries()) {
    entries.push(blogUrlEntry(post));
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
