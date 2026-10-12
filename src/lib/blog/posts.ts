import type { BlogPost, Lang } from "./types";
import { parsePost } from "./parser";

const SUPPORTED: readonly Lang[] = ["en", "ru"] as const;

const modules = import.meta.glob("./posts/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

let cache: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (cache) return cache;

  const posts: BlogPost[] = [];
  for (const [path, raw] of Object.entries(modules)) {
    const m = path.match(/\.\/posts\/([a-z]{2})\/([^/]+)\.md$/i);
    if (!m) continue;

    const lang = m[1].toLowerCase() as Lang;
    const slug = m[2];
    if (!SUPPORTED.includes(lang)) continue;

    try {
      posts.push(parsePost(slug, lang, raw));
    } catch (err) {
      console.error(`[blog] failed to parse ${path}`, err);
    }
  }

  posts.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title),
  );

  cache = posts;
  return posts;
}

export function getPostsByLang(lang: Lang): BlogPost[] {
  return getAllPosts().filter((p) => p.lang === lang);
}

export function getPost(lang: Lang, slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.lang === lang && p.slug === slug);
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.lang === post.lang && p.slug !== post.slug)
    .map((p) => {
      const shared = p.tags.filter((t) => post.tags.includes(t)).length;
      return { post: p, score: shared };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.post.date < b.post.date ? 1 : a.post.date > b.post.date ? -1 : 0),
    )
    .filter((x) => x.score > 0)
    .slice(0, limit)
    .map((x) => x.post);
}

export { SUPPORTED as SUPPORTED_LANGS };
