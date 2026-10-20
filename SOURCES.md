# Data sources

Every source below is one adapter in `src/lib/sources/` registered in
`src/lib/sources/registry.ts`. Adding a new source = one adapter file (or one
`createRssAdapter(...)` config for a feed) + one registry line + one row
here. See `PLAN.md` §2 for the research/reasoning behind these choices.

Only headlines, short summaries, metadata, and the original source link are
ever stored — never full article text (`src/lib/sources/adapters/*`).

All feed URLs below were probed live (reachable, parseable, fresh) before
being added; all terms URLs were fetched and return 200, except where a site
blocks automated requests (noted). The registry
(`src/lib/sources/registry.ts`) is the source of truth — this table mirrors it.

| Source | Type | Key required | Notes |
|---|---|---|---|
| GDELT 2.0 | Flat-file CSV | No | Reads the latest 2 of its 15-min files per run; up to 40 events/run. Country by point-in-polygon on official Indian boundaries. |
| The Guardian Open Platform | API | `GUARDIAN_API_KEY` | Not live-tested (no key). One request per section (world/politics/business). |
| GNews | API | `GNEWS_API_KEY` | Not live-tested (no key). Free: 100 req/day, 10 articles/request. |
| NewsData.io | API | `NEWSDATA_API_KEY` | Not live-tested (no key). Route to Reuters content (see below). |
| The Hindu — National, International | RSS | No | |
| Indian Express — India, World | RSS | No | |
| Hindustan Times — India, World | RSS | No | |
| NDTV — India, World | RSS | No | Site blocks automated requests to its terms page; homepage listed. |
| Times of India — India, World | RSS | No | Terms page lives on indiatimes.com. |
| Economic Times — Economy | RSS | No | |
| LiveMint | RSS | No | |
| RBI press releases | RSS | No | Official, rbi.org.in. |
| PIB | RSS (third-party mirror) | No | pib.gov.in's own RSS serves Hindi/times out; see note below. |
| BBC — World, Asia, Business | RSS | No | |
| Al Jazeera | RSS | No | |
| The Guardian — World | RSS | No | Public RSS, no key needed (separate from the API above). |
| DW, France 24, NPR, Sky News | RSS | No | |
| The Diplomat | RSS | No | Asia-Pacific geopolitics. Terms page blocks bots; homepage listed. |
| UN News | RSS | No | |
| Telegram — public channels | Public web preview (`t.me/s/<channel>`) | No (list in `TELEGRAM_PUBLIC_CHANNELS`) | Off until the secret is set. Up to 40 channels, 1.5 s between requests. Headline + 400-char snippet + link only. |
| Telegram — your subscriptions | MTProto (teleproto) | `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION` | Off until set. Broadcast channels only — never private chats or groups. Optional allow-list in `TELEGRAM_CHANNELS`. Stops on FloodWait. |

Telegram channel names are never written to Actions logs (counts only),
but each ingested item's source label shows the channel title on the public
dashboard — only list channels you're happy to show.

Rejected after probing: **The Print** (malformed XML), **Business Standard**
(403 for automated readers).

**Placement and filtering** (applies to every RSS/API source):
- Country detection covers every country (generated from the map data),
  nationality words ("French", "Australian") and common alternative names.
  Items naming no single country are **kept** as "Global" (feed, not map) —
  they used to be silently dropped (~40% of BBC/UN News).
- A deliberately narrow off-topic filter (`src/lib/sources/relevance.ts`)
  removes sport/entertainment/lifestyle stories from general news sections.

**Not implemented:**

| Source | Type | Key required | Status | Notes |
|---|---|---|---|---|
| MEA India | — | — | Not implemented | No reliably stable public RSS found as of the Phase 1 research pass — see PLAN.md. Candidate for a later scrape-based adapter. |
| ACLED | — | — | Not implemented | Deliberately skipped — free-tier licensing for a publicly deployed site is ambiguous. GDELT's conflict/protest event codes cover this instead. See PLAN.md §2. |
| NewsAPI.org | — | — | Not implemented | Deliberately excluded — its free tier has historically forbidden production/deployed use. See PLAN.md §2. |
| **Reuters** | — | — | Not a direct source — see below | No current free, legal, programmatic path for an individual. Reaches the dashboard via NewsData.io instead. |

### Why there's no direct Reuters adapter

Checked live (WebSearch) when this was requested:
- Reuters shut down its own public RSS feeds in **2020** — the old `feeds.reuters.com` URLs no longer resolve. There is no free Reuters API for individuals; redistribution is only available through paid wire syndication (Reuters Connect).
- The common "workaround" — a Google News RSS search scoped to `site:reuters.com` — was deliberately **not** used: Google News' terms of use restrict the feed to personal, non-commercial reading and explicitly prohibit scraping/redisplaying its content on another site or app. Using it here would be the same class of problem as excluding NewsAPI.org above.
- GDELT was checked too (it crawls reuters.com among many other wire sources) — a live sample of 60 top-mentioned GDELT events that day returned **zero** reuters.com links, so it isn't a dependable path either.
- **NewsData.io explicitly lists Reuters among its 100,000+ licensed sources** (confirmed via its own docs/blog). Its `/latest` response includes a `source_name` field per article — `src/lib/sources/adapters/newsdata.ts` now surfaces that real byline instead of hardcoding "NewsData.io", so a Reuters-bylined story shows up labeled **Reuters** once `NEWSDATA_API_KEY` is set. GNews's adapter was updated the same way (it carries `article.source.name` too) for the same reason. No separate adapter needed or legally possible.

"Live-tested" = actually fetched real data from this source during
development (not just read the docs). The three API sources need their free
keys (see `.env.example`) before they can be tested or enabled — until a key
is set, that adapter's `enabled()` returns `false` and the ingestion script
simply skips it (logged as `[skip]`, not an error).

## GDELT column layout note

The GDELT 2.0 event-export column indices in
`src/lib/sources/adapters/gdelt.ts` were taken from training knowledge and
flagged `[VERIFY]` when first written (no live web access in that session) —
they were then live-tested against a real GDELT export file and confirmed
correct (sane titles, places, and coordinates came back). GDELT hasn't
changed this layout in years, but if a future run ever produces obviously
wrong lat/lng or place names, that column mapping is the first place to
check.

## PIB note — official feed unreliable, using a third-party mirror

`pib.gov.in`'s own RSS system (`RssMain.aspx`) was tested live across every
`Lang`/`Regid` parameter combination documented anywhere findable — it
either returned Hindi content regardless of the language parameter, or timed
out entirely. Rather than ship a source that silently serves the wrong
language, `src/lib/sources/registry.ts` uses
`gkgangavarapu.github.io/pibindia-rss/feed.xml`, a community project that
scrapes PIB Delhi's English releases daily and republishes them as clean RSS.
Each item still links back to the real `pib.gov.in` press-release page, not
the mirror — only the feed mechanics are third-party. Being an unofficial,
volunteer-maintained mirror, it carries more staleness risk than the other
sources here; if it ever stops updating, that's the first thing to check,
and PIB's own RSS system is worth re-testing periodically in case it's fixed.

## Encoding bug found and fixed (PIB)

The first live ingestion run produced garbled/mojibake text for PIB items
(a classic UTF-8-decoded-as-Latin-1 double-encoding signature). Root cause:
`rss-parser`'s own `parseURL()` HTTP layer mis-detected the feed's charset.
Fixed in `src/lib/sources/adapters/rss.ts` by fetching each feed manually
(`fetch().text()`, which follows the WHATWG Encoding spec correctly) and
handing the already-correctly-decoded text to `parser.parseString()` instead
— this fixes charset handling for every RSS source, not just PIB.

## Resilience

Every adapter runs inside a try/catch in `scripts/ingest.ts` — one source
throwing (a changed RSS path, an expired key, a timeout) never stops the
others. Each run's outcome per source (success count, or the error message)
is written to the `sources` table, so a quietly-broken source is visible
without needing to watch GitHub Actions logs.
