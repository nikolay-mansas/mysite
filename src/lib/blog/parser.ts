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
    .slice(0, 60) || "section";

const MARK_OPEN = "\uE000";
const MARK_CLOSE = "\uE001";
const MARK_RE = new RegExp(`${MARK_OPEN}(\\d+)${MARK_CLOSE}`, "g");
const MARK_REPLACE_RE = /[\uE000\uE001]/g;
const SUPPORTED_LOCALES = new Set<string>(["en", "ru"]);

type Align = "left" | "right" | "center" | null;

function localizeInternalLink(url: string, lang: Lang): string {
  if (!url.startsWith("/")) return url;
  if (url.startsWith("//")) return url;
  if (lang === "en") return url;

  if (url === `/${lang}` || url.startsWith(`/${lang}/`)) return url;

  const firstSeg = url.split("/")[1];
  if (firstSeg && SUPPORTED_LOCALES.has(firstSeg) && firstSeg !== "en") {
    return url;
  }

  return `/${lang}${url}`;
}

function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function parseAlignments(sep: string): Align[] {
  return splitTableRow(sep).map((c) => {
    const left = c.startsWith(":");
    const right = c.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });
}

function alignStyle(a: Align): string {
  return a ? ` style="text-align:${a}"` : "";
}

function isTableSeparator(line: string): boolean {
  const s = line.trim();
  if (!s.includes("|")) return false;
  const cells = splitTableRow(s);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function isTableRow(line: string): boolean {
  const s = line.trim();
  return s.includes("|") && !isTableSeparator(s);
}

function renderMath(inner: string): string {
  let s = inner;

  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|mathsf)\{([^}]*)\}/g, "$1");

  s = s.replace(/\{,\}/g, ",");

  s = s.replace(/\\sqrt\{([^}]*)\}/g, "√($1)");

  s = s.replace(/\^\{([^{}]*)\}/g, "<sup>$1</sup>");
  s = s.replace(/_\{([^{}]*)\}/g, "<sub>$1</sub>");

  s = s.replace(/\^([A-Za-z0-9])/g, "<sup>$1</sup>");
  s = s.replace(/_([A-Za-z0-9])/g, "<sub>$1</sub>");

  s = s.replace(/\\[,;:!]/g, "\u2009");
  s = s.replace(/\\ /g, " ");

  s = s.replace(/\\times\b/g, "×");
  s = s.replace(/\\cdot\b/g, "·");
  s = s.replace(/\\pm\b/g, "±");
  s = s.replace(/\\leq?\b/g, "≤");
  s = s.replace(/\\geq?\b/g, "≥");
  s = s.replace(/\\neq?\b/g, "≠");
  s = s.replace(/\\approx\b/g, "≈");
  s = s.replace(/\\infty\b/g, "∞");

  return s;
}

function renderInline(text: string, lang: Lang): string {
  let s = escapeHtml(text).replace(MARK_REPLACE_RE, "");

  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, code: string) => {
    const idx = codes.length;
    codes.push(code);
    return `${MARK_OPEN}${idx}${MARK_CLOSE}`;
  });

  s = s.replace(
    /\$([^$<>\n]+)\$/g,
    (_, math: string) => `<span class="md-math">${renderMath(math)}</span>`,
  );

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
      const href = external ? url : localizeInternalLink(url, lang);
      return `<a href="${href}"${attrs}>${label}</a>`;
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

function renderSummary(inner: string, lang: Lang): string {
  const allowed = /<\/?(?:strong|em|b|i|code|kbd|s|del|mark|span|br)\s*\/?>/gi;
  const parts: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = allowed.exec(inner))) {
    if (m.index > last) {
      parts.push(renderInline(inner.slice(last, m.index), lang));
    }
    parts.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < inner.length) {
    parts.push(renderInline(inner.slice(last), lang));
  }
  return parts.join("");
}

export function renderMarkdown(md: string, lang: Lang = "en"): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const usedIds = new Map<string, number>();
  const uniqueHeadingId = (text: string): string => {
    const base = slugify(text);
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${renderInline(paragraph.join(" "), lang)}</p>`);
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
      const codeLang = fence[1] ?? "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      const langAttr = codeLang ? ` data-lang="${escapeHtml(codeLang)}"` : "";
      out.push(
        `<pre class="md-pre"${langAttr}><code class="md-code-block">${escapeHtml(
          buf.join("\n"),
        )}</code></pre>`,
      );
      continue;
    }

    const detailsOpen = line.match(/^\s*<details(\s[^>]*)?>(.*)$/i);
    if (detailsOpen) {
      flushParagraph();
      closeList();

      const attrs = detailsOpen[1] ?? "";
      const isOpen = /\bopen\b/i.test(attrs) ? " open" : "";

      const inner: string[] = [];
      const trailing = (detailsOpen[2] ?? "").trimEnd();
      if (trailing) inner.push(trailing);
      i++;
      while (i < lines.length && !/^\s*<\/details>\s*$/i.test(lines[i])) {
        inner.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;

      const joined = inner.join("\n");
      const summaryMatch = joined.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);

      const summaryHtml = summaryMatch
        ? renderSummary(summaryMatch[1].trim(), lang)
        : "";

      const bodySource = summaryMatch
        ? joined.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "")
        : joined;

      const bodyHtml = renderMarkdown(bodySource, lang);

      out.push(
        `<details class="md-details"${isOpen}>` +
          (summaryHtml
            ? `<summary class="md-summary">${summaryHtml}</summary>`
            : "") +
          `<div class="md-details-body">${bodyHtml}</div>` +
          `</details>`,
      );
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushParagraph();
      closeList();
      const level = h[1].length;
      const text = h[2].trim();
      const id = uniqueHeadingId(text);
      const safeId = escapeHtml(id);
      out.push(
        `<h${level} id="${safeId}">${renderInline(text, lang)}` +
          `<a href="#${safeId}" class="md-heading-anchor" ` +
          `aria-label="Copy link to section" title="Copy link to section">#</a>` +
          `</h${level}>`,
      );
      i++;
      continue;
    }

    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      flushParagraph();
      closeList();

      const headers = splitTableRow(line);
      const aligns = parseAlignments(lines[i + 1]);
      const rows: string[][] = [];

      i += 2;
      while (
        i < lines.length &&
        lines[i].trim().length > 0 &&
        isTableRow(lines[i])
      ) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }

      const thead = headers
        .map(
          (cell, idx) =>
            `<th${alignStyle(aligns[idx] ?? null)}>${renderInline(cell, lang)}</th>`,
        )
        .join("");

      const tbody = rows
        .map((row) => {
          const cells = headers.map((_, idx) => row[idx] ?? "");
          const tds = cells
            .map(
              (c, idx) =>
                `<td${alignStyle(aligns[idx] ?? null)}>${renderInline(c, lang)}</td>`,
            )
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");

      out.push(
        `<div class="md-table-wrapper"><table>` +
          `<thead><tr>${thead}</tr></thead>` +
          `<tbody>${tbody}</tbody>` +
          `</table></div>`,
      );
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
      out.push(
        `<blockquote>${renderMarkdown(quote.join("\n"), lang)}</blockquote>`,
      );
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
      out.push(`<li>${renderInline(ul[1], lang)}</li>`);
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
      out.push(`<li>${renderInline(ol[1], lang)}</li>`);
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
    html: renderMarkdown(content, lang),
    readingTime: estimateReadingTime(content),
  };
}
