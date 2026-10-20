// Off-topic filter for general-news feeds (Indian outlets' "India news"
// sections carry cricket, film and lifestyle stories alongside politics).
// Deliberately NARROW — every term is specific to sport/entertainment/
// lifestyle, so it can't swallow real news. An over-broad filter would
// recreate the "silently dropping real news" problem this was built next
// to. Terms like "match", "test", "star" or "Olympics" are intentionally
// absent: too ambiguous, or sometimes genuinely geopolitical.
const OFF_TOPIC_TERMS = [
  // sport
  "cricket", "IPL", "T20", "ODI", "Test match", "wicket", "wickets", "batsman", "batter", "bowler",
  "Ranji Trophy", "Premier League", "La Liga", "Champions League", "Wimbledon", "Grand Slam",
  "goalkeeper", "hat-trick", "FIFA World Cup", "kabaddi",
  // entertainment
  "Bollywood", "Tollywood", "Kollywood", "box office", "trailer", "teaser", "web series",
  "OTT release", "Bigg Boss", "actress", "box-office",
  // lifestyle
  "horoscope", "zodiac", "astrology", "recipe", "recipes", "skincare", "fashion week",
];

const PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${OFF_TOPIC_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`,
  "iu",
);

// Auto-generated stock-tip articles (a network of sites, e.g. "Daily
// Political", that GDELT indexes): "Acme Corp (NYSE:ACM) Shares Bought by…",
// "$ABT Shares…". Matched by an exchange-prefixed ticker, which ordinary
// business news headlines almost never carry.
const STOCK_TICKER =
  /\((?:NYSE|NASDAQ|NasdaqGS|NasdaqGM|NasdaqCM|NYSEARCA|NYSEAMERICAN|AMEX|OTCMKTS|LON|TSE|TSX|ASX|NSE|BSE)\s*:\s*[A-Z][A-Z0-9.]*\)|(?<![\p{L}\p{N}])\$[A-Z]{1,5} Shares\b/u;

export function isOffTopic(text: string): boolean {
  return PATTERN.test(text) || STOCK_TICKER.test(text);
}
