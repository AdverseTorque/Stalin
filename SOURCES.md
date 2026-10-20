# Data sources

Every source below is one adapter in `src/lib/sources/` registered in
`src/lib/sources/registry.ts`. Adding a new source = one adapter file (or one
`createRssAdapter(...)` config for a feed) + one registry line + one row
here. See `PLAN.md` §2 for the research/reasoning behind these choices.

Only headlines, short summaries, metadata, and the original source link are
ever stored — never full article text (`src/lib/sources/adapters/*`).

| Source | Type | Key required | Live-tested | Terms |
|---|---|---|---|---|
| GDELT 2.0 | Flat-file (CSV, no API) | No | ✅ (verified live, see below) | https://www.gdeltproject.org/about.html |
| The Guardian Open Platform | API | `GUARDIAN_API_KEY` | ⚠️ not tested (no key yet) | https://open-platform.theguardian.com/documentation/ |
| GNews | API | `GNEWS_API_KEY` | ⚠️ not tested (no key yet) | https://gnews.io/docs/v4 |
| NewsData.io | API | `NEWSDATA_API_KEY` | ⚠️ not tested (no key yet) | https://newsdata.io/documentation |
| BBC World (RSS) | RSS | No | ✅ (verified live) | https://www.bbc.co.uk/usingthebbc/terms-of-use/ |
| Al Jazeera (RSS) | RSS | No | ✅ (verified live) | https://www.aljazeera.com/terms-and-conditions/ |
| The Hindu (RSS) | RSS | No | ✅ (verified live) | https://www.thehindu.com/termsandconditions/ |
| Indian Express (RSS) | RSS | No | ✅ (verified live) | https://indianexpress.com/terms-of-use/ |
| UN News (RSS) | RSS | No | ✅ (verified live) | https://www.un.org/en/about-us/terms-of-use |
| PIB (RSS) | RSS | No | ✅ (verified live) | https://pib.gov.in/ |
| MEA India | — | — | Not implemented | No reliably stable public RSS found as of the Phase 1 research pass — see PLAN.md. Candidate for a later scrape-based adapter. |
| ACLED | — | — | Not implemented | Deliberately skipped — free-tier licensing for a publicly deployed site is ambiguous. GDELT's conflict/protest event codes cover this instead. See PLAN.md §2. |
| NewsAPI.org | — | — | Not implemented | Deliberately excluded — its free tier has historically forbidden production/deployed use. See PLAN.md §2. |

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

## Resilience

Every adapter runs inside a try/catch in `scripts/ingest.ts` — one source
throwing (a changed RSS path, an expired key, a timeout) never stops the
others. Each run's outcome per source (success count, or the error message)
is written to the `sources` table, so a quietly-broken source is visible
without needing to watch GitHub Actions logs.
