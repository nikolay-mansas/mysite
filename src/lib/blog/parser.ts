import type { BlogPost, Lang } from "./types";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

const MARK_OPEN = "\uE000";
const MARK_CLOSE = "\uE001";
const MARK_RE = new RegExp(`${MARK_OPEN}(\\d+)${MARK_CLOSE}`, "g");
const MARK_REPLACE_RE = /[\uE000\uE001]/g;

function renderInline(text: string): string {
  let s = escapeHtml(text).replace(MARK_REPLACE_RE, "");

  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, code: string) => {
    const idx = codes.length;
    codes.push(code);
    return `${MARK_OPEN}${idx}${MARK_CLOSE}`;
  });

  s = s.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (_, alt: string, url: string) =>
      `<img src="${url}" alt="${alt}" loading="lazy" decoding="async" />`,
  );

  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, label: string, url: string) => {
      const external = /^https?:\/\//i.test(url);
      const attrs = external
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<a href="${url}"${attrs}>${label}</a>`;
    },
  );

  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  s = s.replace(MARK_RE, (_, i: string) => `<code>${codes[Number(i)]}</code>`);

  return s;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      flushParagraph();
      closeList();
      const lang = fence[1] ?? "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : "";
      out.push(
        `<pre class="md-pre"${langAttr}><code class="md-code-block">${escapeHtml(
          buf.join("\n"),
        )}</code></pre>`,
      );
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushParagraph();
      closeList();
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text);
      out.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      closeList();
      out.push("<hr />");
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      closeList();
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderInline(quote.join(" "))}</blockquote>`);
      continue;
    }

    const ul = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ul) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${renderInline(ul[1])}</li>`);
      i++;
      continue;
    }

    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ol) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${renderInline(ol[1])}</li>`);
      i++;
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      closeList();
      i++;
      continue;
    }

    paragraph.push(line);
    i++;
  }

  flushParagraph();
  closeList();
  return out.join("\n");
}

function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, content: raw };

  const data: Record<string, unknown> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();

    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      continue;
    }
    value = value.replace(/^["']|["']$/g, "");
    data[key] = value;
  }
  return { data, content: m[2] };
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function parsePost(slug: string, lang: Lang, raw: string): BlogPost {
  const { data, content } = parseFrontmatter(raw);

  return {
    slug,
    lang,
    title: (data.title as string) || slug,
    description: (data.description as string) || "",
    date: (data.date as string) || new Date().toISOString().slice(0, 10),
    updated: (data.updated as string) || undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    content,
    html: renderMarkdown(content),
    readingTime: estimateReadingTime(content),
  };
}
