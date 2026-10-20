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

export function isOffTopic(text: string): boolean {
  return PATTERN.test(text);
}
