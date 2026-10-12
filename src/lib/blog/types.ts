export type Lang = "en" | "ru";

export interface BlogPost {
  slug: string;
  lang: Lang;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  content: string;
  html: string;
  readingTime: number;
}

export interface SearchResult extends BlogPost {
  score: number;
  excerpt: string;
}
