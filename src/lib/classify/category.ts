import type { EventCategory } from "@/lib/types";

// Keyword-based classifier — not NLP, just a practical MVP heuristic (see
// PLAN.md's note on heuristic geocoding/classification). 'india' is reserved
// for stories specifically about Indian governance/politics content, not
// merely stories that happen to be located in India — a conflict story set
// in India still gets tagged 'conflict' so the category filter stays
// meaningful (location is carried separately by country/continent/lat/lng).
const KEYWORDS: Record<EventCategory, string[]> = {
  unrest: [
    "protest", "demonstrat", "rally", "strike", "unrest", "riot", "march",
    "walkout", "civil disobedience", "picket",
  ],
  conflict: [
    "war", "attack", "militant", "terroris", "bomb", "airstrike", "ceasefire",
    "troops", "insurgent", "clash", "shelling", "missile", "gunmen",
    "offensive", "military operation",
  ],
  economics: [
    "inflation", "market", "central bank", "interest rate", "gdp", "trade",
    "tariff", "currency", "stocks", "oil price", "imf", "world bank",
    "recession", "economy", "exports", "deficit", "rbi", "rupee", "opec",
  ],
  geopolitics: [
    "summit", "treaty", "bilateral", "diplomat", "embassy", "sanctions",
    "united nations", "alliance", "foreign minister", "nato", "g7", "g20",
    "foreign policy", "visa",
  ],
  india: [
    "parliament", "lok sabha", "rajya sabha", "supreme court of india",
    "high court", "cabinet", "pib", "election commission", "budget session",
    "chief minister", "governor", "assembly election", "ministry of",
    "lieutenant governor", "niti aayog",
  ],
};

const CATEGORY_ORDER = Object.keys(KEYWORDS) as EventCategory[];

export function classifyCategory(text: string, country: string | null): EventCategory {
  const lower = text.toLowerCase();
  let best: EventCategory | null = null;
  let bestScore = 0;

  for (const category of CATEGORY_ORDER) {
    const score = KEYWORDS[category].reduce(
      (acc, word) => acc + (lower.includes(word) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  if (best) return best;
  // No keyword signal at all — fall back on geography for India-sourced
  // items, otherwise default to the broadest bucket.
  return country === "India" ? "india" : "geopolitics";
}
