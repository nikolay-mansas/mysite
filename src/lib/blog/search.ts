import type { BlogPost, SearchResult } from "./types";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/[>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExcerpt(plain: string, terms: string[], max = 180): string {
  const lower = plain.toLowerCase();
  let idx = -1;
  for (const t of terms) {
    const p = lower.indexOf(t);
    if (p !== -1 && (idx === -1 || p < idx)) idx = p;
  }
  if (idx === -1) {
    return plain.length > max ? plain.slice(0, max).trimEnd() + "…" : plain;
  }
  const start = Math.max(0, idx - 60);
  const end = Math.min(plain.length, start + max);
  let snippet = plain.slice(start, end).trim();
  if (start > 0) snippet = "…" + snippet;
  if (end < plain.length) snippet += "…";
  return snippet;
}

export function searchPosts(
  posts: BlogPost[],
  query: string,
  limit = 5,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const terms = Array.from(
    new Set(q.split(/\s+/).filter((t) => t.length >= 2)),
  );
  if (!terms.length) return [];

  const results: SearchResult[] = [];

  for (const post of posts) {
    const title = post.title.toLowerCase();
    const description = post.description.toLowerCase();
    const tags = post.tags.map((t) => t.toLowerCase());
    const plain = stripMarkdown(post.content);
    const body = plain.toLowerCase();

    let score = 0;
    let matchedTerms = 0;

    for (const term of terms) {
      const re = new RegExp(escapeRegex(term), "g");
      const wordRe = new RegExp(`\\b${escapeRegex(term)}\\b`, "g");

      const titleWord = (title.match(wordRe) || []).length;
      const titleAny = (title.match(re) || []).length;
      const tagHits = tags.reduce(
        (acc, t) => acc + (t.includes(term) ? 1 : 0),
        0,
      );
      const descHits = (description.match(re) || []).length;
      const bodyHits = (body.match(re) || []).length;

      if (titleAny + tagHits + descHits + bodyHits > 0) matchedTerms++;

      score += titleWord * 40;
      score += titleAny * 15;
      score += tagHits * 20;
      score += descHits * 6;
      score += Math.min(bodyHits, 15) * 2;
    }

    if (matchedTerms > 0) {
      score += matchedTerms * 5;
      results.push({ ...post, score, excerpt: buildExcerpt(plain, terms) });
    }
  }

  results.sort(
    (a, b) =>
      b.score - a.score || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
  );
  return results.slice(0, limit);
}
