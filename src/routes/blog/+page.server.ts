import type { PageServerLoad } from "./$types";
import { getPostsByLang, SUPPORTED_LANGS } from "$lib/blog/posts";
import { searchPosts } from "$lib/blog/search";
import type { Lang } from "$lib/blog/types";

function detectLang(pathname: string): Lang {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return (SUPPORTED_LANGS as readonly string[]).includes(seg)
    ? (seg as Lang)
    : "en";
}

export const load: PageServerLoad = ({ url }) => {
  const lang = detectLang(url.pathname);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const posts = getPostsByLang(lang);

  if (q) {
    const results = searchPosts(posts, q, 5);
    return { lang, q, mode: "search" as const, results, posts: [] };
  }

  return { lang, q: "", mode: "list" as const, results: [], posts };
};
