// Telegram via the user's own account (MTProto). Runs only inside the
// scheduled GitHub Actions ingestion job — never in the deployed app.
//
// Library: teleproto, the maintained fork of GramJS (GramJS's own README
// points to it; the GramJS repo is archived). API surface used here was
// checked against teleproto's type definitions, not assumed.
//
// Safety rules (from the brief, enforced in code):
// - CHANNELS ONLY. In this library a supergroup (a group chat) is also a
//   Channel object, so `isChannel` alone would include group chats — the
//   filter is `isChannel && !isGroup` (broadcast channels only). Private
//   chats and groups are never read.
// - Telegram rate limits: waits under FLOOD_SLEEP_SECONDS are slept through
//   by the library; a longer FloodWait stops this run entirely rather than
//   pushing on (protects the account from restrictions).
// - Privacy: the repo is public, so its Actions logs are public. Nothing
//   here logs channel names — counts only.
//
// Config (all GitHub secrets): TELEGRAM_API_ID, TELEGRAM_API_HASH,
// TELEGRAM_SESSION (from `npm run telegram:login`, run locally), and
// TELEGRAM_CHANNELS = "all" (default) or comma-separated usernames/ids.
import { TelegramClient, errors } from "teleproto";
import { StringSession } from "teleproto/sessions";
import { classifyCategory } from "@/lib/classify/category";
import { classifySeverityFromText } from "@/lib/classify/severity";
import { splitPost } from "@/lib/sources/adapters/telegram-public";
import { placeFromText } from "@/lib/sources/place";
import { isOffTopic } from "@/lib/sources/relevance";
import type { NormalizedItem, SourceAdapter } from "@/lib/sources/types";

const FLOOD_SLEEP_SECONDS = 60;
const MAX_CHANNELS = 60;
const MESSAGES_PER_CHANNEL = 20;
// Runs every 20 min; a 6h lookback tolerates skipped/delayed scheduler runs
// (duplicates are discarded by the DB's unique url/content-hash).
const LOOKBACK_MS = 6 * 60 * 60 * 1000;
const PER_CHANNEL_DELAY_MS = 1_000;

function credentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = process.env.TELEGRAM_SESSION;
  if (!Number.isInteger(apiId) || apiId <= 0 || !apiHash || !session) return null;
  return { apiId, apiHash, session };
}

/** Exported for tests: does this channel match the TELEGRAM_CHANNELS selection? */
export function channelSelected(selection: string | undefined, username: string | undefined, id: string): boolean {
  const raw = (selection ?? "all").trim();
  if (raw === "" || raw.toLowerCase() === "all") return true;
  const wanted = raw.split(",").map((s) => s.trim().replace(/^@/, "").toLowerCase()).filter(Boolean);
  return wanted.includes(id) || (username !== undefined && wanted.includes(username.toLowerCase()));
}

export const telegramMtprotoAdapter: SourceAdapter = {
  name: "Telegram (your channels)",
  type: "telegram",
  homepageUrl: "https://telegram.org/",
  termsUrl: "https://core.telegram.org/api/terms",
  enabled: () => credentials() !== null,
  async fetch(): Promise<NormalizedItem[]> {
    const creds = credentials();
    if (!creds) return [];

    const client = new TelegramClient(new StringSession(creds.session), creds.apiId, creds.apiHash, {
      connectionRetries: 3,
      floodSleepThreshold: FLOOD_SLEEP_SECONDS,
    });
    const items: NormalizedItem[] = [];
    let channelsRead = 0;
    try {
      await client.connect();
      if (!(await client.isUserAuthorized())) {
        throw new Error("Telegram session is not authorised — re-run `npm run telegram:login` and update TELEGRAM_SESSION");
      }

      const dialogs = await client.getDialogs({});
      const channels = dialogs
        .filter((d) => d.isChannel && !d.isGroup) // broadcast channels only — see header
        .filter((d) => {
          const entity = d.entity as { username?: string; id?: { toString(): string } } | undefined;
          return channelSelected(process.env.TELEGRAM_CHANNELS, entity?.username, entity?.id?.toString() ?? "");
        })
        .slice(0, MAX_CHANNELS);

      const cutoff = Date.now() - LOOKBACK_MS;
      for (const d of channels) {
        const entity = d.entity as { username?: string; id?: { toString(): string }; title?: string };
        const messages = await client.getMessages(d.entity, { limit: MESSAGES_PER_CHANNEL });
        channelsRead++;
        for (const m of messages) {
          if (!m.message || m.date * 1000 < cutoff) continue;
          const lines = m.message.split("\n").map((l) => l.trim()).filter(Boolean);
          const { title, summary } = splitPost(lines);
          if (!title || isOffTopic(m.message)) continue;
          const text = `${title} ${summary}`;
          const place = placeFromText(text);
          const channelId = entity.id?.toString() ?? "";
          items.push({
            source: `Telegram · ${entity.title ?? "channel"}`,
            sourceType: "telegram",
            title,
            summary: summary || title,
            // Public channels get a public link; private ones a members-only t.me/c/ link.
            url: entity.username ? `https://t.me/${entity.username}/${m.id}` : `https://t.me/c/${channelId}/${m.id}`,
            publishedAt: new Date(Math.min(m.date * 1000, Date.now())),
            category: classifyCategory(text, place.country),
            severity: classifySeverityFromText(text),
            ...place,
            tags: ["telegram"],
          });
        }
        await new Promise((r) => setTimeout(r, PER_CHANNEL_DELAY_MS));
      }
    } catch (err) {
      // A FloodWait longer than the threshold lands here: stop this run and
      // keep what was read so far — never push on through a rate limit.
      if (err instanceof errors.FloodWaitError) {
        console.log(`  telegram: rate-limited by Telegram for ${err.seconds}s — stopping this run early`);
      } else {
        throw err;
      }
    } finally {
      await client.disconnect().catch(() => {});
    }
    console.log(`  telegram: read ${channelsRead} channel(s)`); // counts only, never names
    return items;
  },
};
