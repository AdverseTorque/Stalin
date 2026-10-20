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
    publisher: "BBC",
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
  // --- Indian outlets. Section feeds (national/world), not the "everything"
  // feeds, which mix in sport and entertainment. defaultCountry only for the
  // national sections: a world-section story naming no country is "Global",
  // not India. Every URL live-probed (scripts/_probe-feeds.ts) before adding.
  createRssAdapter({
    name: "The Hindu (National)",
    publisher: "The Hindu",
    feedUrl: "https://www.thehindu.com/news/national/feeder/default.rss",
    homepageUrl: "https://www.thehindu.com/",
    termsUrl: "https://www.thehindu.com/termsofuse/",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "The Hindu (International)",
    publisher: "The Hindu",
    feedUrl: "https://www.thehindu.com/news/international/feeder/default.rss",
    homepageUrl: "https://www.thehindu.com/",
    termsUrl: "https://www.thehindu.com/termsofuse/",
  }),
  createRssAdapter({
    name: "Indian Express (India)",
    publisher: "Indian Express",
    feedUrl: "https://indianexpress.com/section/india/feed/",
    homepageUrl: "https://indianexpress.com/",
    termsUrl: "https://indianexpress.com/terms-and-conditions/",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "Indian Express (World)",
    publisher: "Indian Express",
    feedUrl: "https://indianexpress.com/section/world/feed/",
    homepageUrl: "https://indianexpress.com/",
    termsUrl: "https://indianexpress.com/terms-and-conditions/",
  }),
  createRssAdapter({
    name: "Hindustan Times (India)",
    publisher: "Hindustan Times",
    feedUrl: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
    homepageUrl: "https://www.hindustantimes.com/",
    termsUrl: "https://www.hindustantimes.com/terms-of-use",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "Hindustan Times (World)",
    publisher: "Hindustan Times",
    feedUrl: "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml",
    homepageUrl: "https://www.hindustantimes.com/",
    termsUrl: "https://www.hindustantimes.com/terms-of-use",
  }),
  createRssAdapter({
    name: "NDTV (India)",
    publisher: "NDTV",
    feedUrl: "https://feeds.feedburner.com/ndtvnews-india-news",
    homepageUrl: "https://www.ndtv.com/",
    termsUrl: "https://www.ndtv.com/",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "NDTV (World)",
    publisher: "NDTV",
    feedUrl: "https://feeds.feedburner.com/ndtvnews-world-news",
    homepageUrl: "https://www.ndtv.com/",
    termsUrl: "https://www.ndtv.com/",
  }),
  createRssAdapter({
    name: "Times of India (India)",
    publisher: "Times of India",
    feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    homepageUrl: "https://timesofindia.indiatimes.com/",
    termsUrl: "https://www.indiatimes.com/termsandcondition",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "Times of India (World)",
    publisher: "Times of India",
    feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    homepageUrl: "https://timesofindia.indiatimes.com/",
    termsUrl: "https://www.indiatimes.com/termsandcondition",
  }),
  createRssAdapter({
    name: "Economic Times (Economy)",
    publisher: "Economic Times",
    feedUrl: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
    homepageUrl: "https://economictimes.indiatimes.com/",
    termsUrl: "https://economictimes.indiatimes.com/terms-conditions",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "LiveMint",
    feedUrl: "https://www.livemint.com/rss/news",
    homepageUrl: "https://www.livemint.com/",
    termsUrl: "https://www.livemint.com/terms-of-use",
    defaultCountry: "India",
  }),
  createRssAdapter({
    name: "RBI",
    feedUrl: "https://rbi.org.in/pressreleases_rss.xml",
    homepageUrl: "https://www.rbi.org.in/",
    termsUrl: "https://www.rbi.org.in/Scripts/Disclaimer.aspx",
    defaultCountry: "India",
  }),

  // --- International outlets (all live-probed).
  createRssAdapter({
    name: "The Guardian (World)",
    publisher: "The Guardian",
    feedUrl: "https://www.theguardian.com/world/rss",
    homepageUrl: "https://www.theguardian.com/world",
    termsUrl: "https://www.theguardian.com/help/terms-of-service",
  }),
  createRssAdapter({
    name: "DW",
    feedUrl: "https://rss.dw.com/rdf/rss-en-world",
    homepageUrl: "https://www.dw.com/en/",
    termsUrl: "https://www.dw.com/en/legal-notice/a-63500643",
  }),
  createRssAdapter({
    name: "France 24",
    feedUrl: "https://www.france24.com/en/rss",
    homepageUrl: "https://www.france24.com/en/",
    termsUrl: "https://www.france24.com/en/terms-of-use",
  }),
  createRssAdapter({
    name: "NPR",
    feedUrl: "https://feeds.npr.org/1004/rss.xml",
    homepageUrl: "https://www.npr.org/sections/world/",
    termsUrl: "https://www.npr.org/about-npr/179876898/terms-of-use",
  }),
  createRssAdapter({
    name: "Sky News",
    feedUrl: "https://feeds.skynews.com/feeds/rss/world.xml",
    homepageUrl: "https://news.sky.com/world",
    termsUrl: "https://www.sky.com/help/articles/skycom-terms-and-conditions",
  }),
  createRssAdapter({
    name: "BBC (Asia)",
    publisher: "BBC",
    feedUrl: "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
    homepageUrl: "https://www.bbc.com/news/world/asia",
    termsUrl: "https://www.bbc.co.uk/usingthebbc/terms-of-use/",
  }),
  createRssAdapter({
    name: "BBC (Business)",
    publisher: "BBC",
    feedUrl: "https://feeds.bbci.co.uk/news/business/rss.xml",
    homepageUrl: "https://www.bbc.com/news/business",
    termsUrl: "https://www.bbc.co.uk/usingthebbc/terms-of-use/",
  }),
  createRssAdapter({
    name: "The Diplomat",
    feedUrl: "https://thediplomat.com/feed/",
    homepageUrl: "https://thediplomat.com/",
    termsUrl: "https://thediplomat.com/",
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
