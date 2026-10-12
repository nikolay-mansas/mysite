import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageServerLoad } from "./$types";
import {
  getAllPosts,
  getPost,
  getRelatedPosts,
  SUPPORTED_LANGS,
} from "$lib/blog/posts";
import type { Lang } from "$lib/blog/types";

function detectLang(pathname: string): Lang {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return (SUPPORTED_LANGS as readonly string[]).includes(seg)
    ? (seg as Lang)
    : "en";
}

export const load: PageServerLoad = ({ params, url }) => {
  const lang = detectLang(url.pathname);
  const post = getPost(lang, params.slug);

  if (!post) throw error(404, "Post not found");

  return { post, related: getRelatedPosts(post, 3) };
};

export const entries: EntryGenerator = () => {
  return getAllPosts().map((p) => ({ slug: p.slug }));
};
