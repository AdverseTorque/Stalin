// Telegram, no-login fallback: reads PUBLIC channels' web previews
// (https://t.me/s/<username>). Needs no account or session — only works for
// public channels. Structure verified against a live preview page: each
// post carries data-post="<channel>/<id>", a .tgme_widget_message_text
// block and a <time datetime="…">.
//
// Channel list comes from TELEGRAM_PUBLIC_CHANNELS (comma-separated
// usernames), set as a GitHub secret — NOT committed, because the repo is
// public and a committed list would publish which channels the user follows.
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { placeFromText } from "@/lib/sources/place";
import { isOffTopic } from "@/lib/sources/relevance";
import { htmlToText, parsePublished } from "@/lib/sources/text";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

const MAX_CHANNELS = 40;
const PER_CHANNEL_DELAY_MS = 1_500; // be gentle: sequential, spaced requests

export interface PreviewPost {
  post: string; // "<username>/<id>"
  lines: string[]; // plain-text lines (split on <br>)
  publishedAt: Date | null;
}

/** Pure parser for a t.me/s/<username> page. */
export function parsePreviewHtml(html: string): { channelTitle: string | null; posts: PreviewPost[] } {
  const channelTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? null;
  const posts: PreviewPost[] = [];
  // Each post starts at its data-post attribute; slice the page into blocks there.
  const starts = [...html.matchAll(/data-post="([^"]+)"/g)];
  for (let i = 0; i < starts.length; i++) {
    const block = html.slice(starts[i].index, starts[i + 1]?.index ?? html.length);
    const textHtml = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1];
    if (!textHtml) continue; // media-only post
    // Split on <br> BEFORE flattening to text, so the first line can become the headline.
    const lines = textHtml.split(/<br\s*\/?>/i).map(htmlToText).filter(Boolean);
    if (lines.length === 0) continue;
    posts.push({
      post: starts[i][1],
      lines,
      publishedAt: parsePublished(block.match(/<time[^>]+datetime="([^"]+)"/)?.[1]),
    });
  }
  return { channelTitle: channelTitle ? htmlToText(channelTitle) : null, posts };
}

/**
 * Splits a post into a headline (first line, max ~160 chars on a word
 * boundary) and a short summary. Only these snippets are stored — never the
 * full post (brief §1.2).
 */
export function splitPost(lines: string[]): { title: string; summary: string } {
  let title = lines[0] ?? "";
  if (title.length > 160) title = `${title.slice(0, 160).replace(/\s+\S*$/, "")}…`;
  const rest = lines.slice(1).join(" ");
  const summary = rest.length > 400 ? `${rest.slice(0, 400).replace(/\s+\S*$/, "")}…` : rest;
  return { title, summary };
}

function configuredChannels(): string[] {
  return (process.env.TELEGRAM_PUBLIC_CHANNELS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/^@/, ""))
    .filter((s) => /^[A-Za-z0-9_]{4,64}$/.test(s)) // Telegram username rules; also blocks URL injection
    .slice(0, MAX_CHANNELS);
}

export const telegramPublicAdapter: SourceAdapter = {
  name: "Telegram (public channels)",
  type: "telegram",
  homepageUrl: "https://telegram.org/",
  termsUrl: "https://telegram.org/tos",
  enabled: () => configuredChannels().length > 0,
  async fetch(): Promise<NormalizedItem[]> {
    const items: NormalizedItem[] = [];
    let failures = 0;
    for (const username of configuredChannels()) {
      try {
        const res = await fetch(`https://t.me/s/${username}`, {
          signal: AbortSignal.timeout(15_000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SITREPbot/0.1)" },
        });
        if (!res.ok) {
          failures++;
          continue;
        }
        const { channelTitle, posts } = parsePreviewHtml(await res.text());
        for (const p of posts) {
          const { title, summary } = splitPost(p.lines);
          if (!title || isOffTopic(p.lines.join(" "))) continue;
          const place = placeFromText(`${title} ${summary}`);
          items.push({
            source: `Telegram · ${channelTitle ?? username}`,
            sourceType: "telegram",
            title,
            summary: summary || title,
            url: `https://t.me/${p.post}`,
            publishedAt: p.publishedAt ?? new Date(),
            category: classifyCategory(`${title} ${summary}`, place.country),
            severity: classifySeverityFromText(`${title} ${summary}`),
            ...place,
            tags: ["telegram"],
          });
        }
      } catch {
        failures++;
      }
      await new Promise((r) => setTimeout(r, PER_CHANNEL_DELAY_MS));
    }
    // Counts only — channel names never reach the (public) Actions log.
    if (failures > 0) console.log(`  telegram-public: ${failures} channel(s) could not be read this run`);
    return items;
  },
};
