// Fetches just enough of an article page to read its real <title>/og:title
// and publisher name — used by the GDELT adapter, which otherwise only has
// machine-generated actor/action text (e.g. "Merchant rejected a
// proposal"), not a real headline. Caps the read at MAX_BYTES and bails out
// as soon as </head> is seen, since meta tags live there on virtually every
// real site — avoids downloading full article bodies/scripts just to read
// two meta tags.
import { decodeHtmlEntities } from "@/lib/sources/text";

const MAX_BYTES = 200_000;
const TIMEOUT_MS = 6_000;

const KNOWN_SITE_NAMES: Record<string, string> = {
  "reuters.com": "Reuters",
  "bbc.com": "BBC",
  "bbc.co.uk": "BBC",
  "apnews.com": "AP News",
  "aljazeera.com": "Al Jazeera",
  "nytimes.com": "The New York Times",
  "theguardian.com": "The Guardian",
  "washingtonpost.com": "The Washington Post",
  "cnn.com": "CNN",
  "thehindu.com": "The Hindu",
  "indianexpress.com": "The Indian Express",
  "ndtv.com": "NDTV",
  "hindustantimes.com": "Hindustan Times",
  "timesofindia.indiatimes.com": "Times of India",
  "news.un.org": "UN News",
  "news.cn": "Xinhua",
  "livemint.com": "Mint",
};

export interface ArticleMeta {
  title: string | null;
  description: string | null;
  sourceName: string;
}

export async function fetchArticleMeta(url: string): Promise<ArticleMeta> {
  const html = await fetchPartialHtml(url);
  const { title, description, siteName } = html
    ? extractMeta(html)
    : { title: null, description: null, siteName: null };
  return { title, description, sourceName: deriveSourceName(url, siteName) };
}

async function fetchPartialHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SITREPbot/0.1; +https://github.com/AdverseTorque/Stalin)",
      },
    });
    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      result += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(result)) break;
    }
    reader.cancel().catch(() => {});
    return result;
  } catch {
    return null; // timeout, network error, non-HTML response, etc. — caller treats as "no headline available"
  }
}

function extractMeta(html: string): {
  title: string | null;
  description: string | null;
  siteName: string | null;
} {
  const ogTitle = matchMetaContent(html, "property", "og:title");
  const rawTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const ogSiteName = matchMetaContent(html, "property", "og:site_name");
  const ogDescription =
    matchMetaContent(html, "property", "og:description") ?? matchMetaContent(html, "name", "description");

  const title = decodeHtmlEntities((ogTitle ?? rawTitle ?? "").trim()) || null;
  const siteName = ogSiteName ? decodeHtmlEntities(ogSiteName.trim()) : null;
  const description = ogDescription ? decodeHtmlEntities(ogDescription.trim()).slice(0, 400) : null;
  return { title, description, siteName };
}

function matchMetaContent(html: string, attr: "property" | "name", value: string): string | undefined {
  const esc = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    html.match(new RegExp(`<meta[^>]+${attr}=["']${esc}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${esc}["']`, "i"))?.[1]
  );
}


// og:site_name values that say nothing about the publisher (seen live:
// "English" on english.news.cn, "News", a bare URL).
const GENERIC_SITE_NAME = /^(?:en|english|news|home|homepage|website|online|world|latest news)$|^(?:https?:\/\/|www\.)/i;

// "co.uk", "org.il", "com.au"…: the publisher's name is one label further left.
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);

/** "english.news.cn" -> "news.cn", "en.idi.org.il" -> "idi.org.il". */
function registrableDomain(host: string): string {
  const labels = host.split(".");
  const n = labels.length;
  const take = n >= 3 && labels[n - 1].length === 2 && SECOND_LEVEL.has(labels[n - 2]) ? 3 : 2;
  return labels.slice(-take).join(".");
}

export function deriveSourceName(url: string, ogSiteName: string | null): string {
  if (ogSiteName && !GENERIC_SITE_NAME.test(ogSiteName)) return ogSiteName;
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url; // never show the literal word "Unknown" — the raw url is still a real, honest fallback
  }
  const domain = registrableDomain(host);
  const known = KNOWN_SITE_NAMES[host] ?? KNOWN_SITE_NAMES[domain];
  if (known) return known;
  // Subdomains ("en.", "english.", "news.") name a section, not the publisher.
  return domain
    .split(".")[0]
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
