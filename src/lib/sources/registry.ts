import { createRssAdapter } from "@/lib/sources/adapters/rss";
import { gdeltAdapter } from "@/lib/sources/adapters/gdelt";
import { guardianAdapter } from "@/lib/sources/adapters/guardian";
import { gnewsAdapter } from "@/lib/sources/adapters/gnews";
import { newsdataAdapter } from "@/lib/sources/adapters/newsdata";
import type { SourceAdapter } from "@/lib/sources/types";

/**
 * Every ingestion source lives here as one adapter + one entry — see
 * SOURCES.md for the human-readable version of this same list (type,
 * limits, terms link). Adding a new source: write one adapter file (or one
 * createRssAdapter(...) config for a feed), add it below, and add a row to
 * SOURCES.md.
 *
 * RSS feed URLs below were live-tested (actually fetched real data), not
 * just taken from docs — see SOURCES.md for when/how. If a URL ever goes
 * stale, that adapter's fetch() throws, the ingestion script catches it,
 * logs it to the `sources` table, and every other source still runs
 * normally — one dead feed never takes down the whole pipeline.
 */
export const SOURCE_REGISTRY: SourceAdapter[] = [
  gdeltAdapter,
  guardianAdapter,
  gnewsAdapter,
  newsdataAdapter,

  createRssAdapter({
    name: "BBC World",
    feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    homepageUrl: "https://www.bbc.com/news/world",
    termsUrl: "https://www.bbc.co.uk/usingthebbc/terms-of-use/",
  }),
  createRssAdapter({
    name: "Al Jazeera",
    feedUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    homepageUrl: "https://www.aljazeera.com/",
    termsUrl: "https://www.aljazeera.com/terms-and-conditions/",
  }),
  createRssAdapter({
    name: "The Hindu",
    feedUrl: "https://www.thehindu.com/feeder/default.rss",
    homepageUrl: "https://www.thehindu.com/",
    termsUrl: "https://www.thehindu.com/termsandconditions/",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "Indian Express",
    feedUrl: "https://indianexpress.com/feed/",
    homepageUrl: "https://indianexpress.com/",
    termsUrl: "https://indianexpress.com/terms-of-use/",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "UN News",
    feedUrl: "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    homepageUrl: "https://news.un.org/",
    termsUrl: "https://www.un.org/en/about-us/terms-of-use",
  }),
  createRssAdapter({
    name: "PIB",
    // NOT PIB's own domain — pib.gov.in's own RSS system (RssMain.aspx)
    // was tested live across every Lang/Regid combination and either
    // returned Hindi content regardless of the language param, or timed
    // out. This is a third-party mirror that scrapes PIB Delhi's English
    // releases daily and republishes them as clean RSS, with each item
    // still linking back to the real pib.gov.in press-release page (not
    // the mirror). Revisit if this mirror ever goes stale/unmaintained —
    // see SOURCES.md.
    feedUrl: "https://gkgangavarapu.github.io/pibindia-rss/feed.xml",
    homepageUrl: "https://pib.gov.in/",
    termsUrl: "https://pib.gov.in/",
    defaultCountry: "India",
  }),

  // MEA India: no reliably stable public RSS found as of PLAN.md's research
  // pass — intentionally not implemented yet rather than shipping a scraper
  // that silently breaks. Add a scrape-based adapter here once confirmed.
];
