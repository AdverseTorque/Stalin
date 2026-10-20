// Shared text clean-up for everything ingested from feeds/APIs/pages.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  ndash: "–", mdash: "—", hellip: "…",
};

export function decodeHtmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

// Block-level tags separate words; inline tags (<b>, <a>, <i>…) don't —
// turning every tag into a space produced "Editor ." from "<b>Editor</b>.".
const BLOCK_TAG = /<\/?(?:br|p|div|li|ul|ol|tr|td|th|h[1-6]|blockquote|section|article)\b[^>]*>/gi;

/** HTML -> single-line plain text (tags stripped, entities decoded, whitespace collapsed). */
export function htmlToText(html: string): string {
  return decodeHtmlEntities(html.replace(BLOCK_TAG, " ").replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses a feed/API date. Returns null for missing or unparseable dates
 * (callers decide the fallback), and clamps dates in the future — a few
 * feeds publish timezone-mangled timestamps hours ahead, which would pin
 * them to the top of the feed indefinitely.
 */
export function parsePublished(raw: string | undefined | null, now = Date.now()): Date | null {
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(Math.min(t, now));
}
