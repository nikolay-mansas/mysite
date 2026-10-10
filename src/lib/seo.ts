import { SITE } from "$lib/config";

export function buildSeoUrls(pathname: string) {
  const isRu = pathname.startsWith("/ru");
  const pathNoLocale = pathname.replace(/^\/ru/, "") || "/";
  const localePrefix = isRu ? "/ru" : "";

  const enPath = pathNoLocale === "/" ? "/" : pathNoLocale;
  const ruPath = pathNoLocale === "/" ? "/ru/" : `/ru${pathNoLocale}`;

  return {
    isRu,
    localePrefix,
    pathNoLocale,
    canonical: `${SITE.url}${pathname}`,
    homeUrl: `${SITE.url}${localePrefix}/`,
    toolsUrl: `${SITE.url}${localePrefix}/tools`,
    enUrl: `${SITE.url}${enPath}`,
    ruUrl: `${SITE.url}${ruPath}`,
  };
}
