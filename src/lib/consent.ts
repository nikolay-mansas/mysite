export const CONSENT_KEY = "cookie-consent";
export const METRIKA_ID = 111047575;

export type ConsentValue = "accepted" | "declined";

interface YmFunction {
  (...args: unknown[]): void;
  a?: unknown[];
  l?: number;
}

interface YmWindow extends Window {
  ym?: YmFunction;
  __ym_loaded?: boolean;
}

export function getConsent(): ConsentValue | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function setConsent(value: ConsentValue): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CONSENT_KEY, value);
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${CONSENT_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearConsent(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CONSENT_KEY);
  document.cookie = `${CONSENT_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function loadYandexMetrika(): void {
  if (typeof window === "undefined") return;

  const w = window as YmWindow;
  if (w.__ym_loaded) return;
  w.__ym_loaded = true;

  const ym: YmFunction = (...args: unknown[]) => {
    (ym.a = ym.a ?? []).push(args);
  };
  ym.l = Date.now();
  w.ym = w.ym ?? ym;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
  document.head.appendChild(script);

  w.ym(METRIKA_ID, "init", {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("open-cookie-settings"));
}
