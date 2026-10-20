import type { Severity } from "@/lib/types";

const CRITICAL_WORDS = [
  "killed", "dead", "deaths", "massacre", "bombing", "explosion",
  "assassinat", "coup", "dozens killed", "death toll",
];
const HIGH_WORDS = [
  "attack", "clash", "injured", "wounded", "crisis", "collapse", "resign",
  "emergency", "unrest", "militant",
];
const MEDIUM_WORDS = [
  "protest", "strike", "warning", "tension", "dispute", "sanction", "walkout",
];

/** Keyword fallback for sources without their own conflict/cooperation score (i.e. everything except GDELT). */
export function classifySeverityFromText(text: string): Severity {
  const lower = text.toLowerCase();
  if (CRITICAL_WORDS.some((w) => lower.includes(w))) return "critical";
  if (HIGH_WORDS.some((w) => lower.includes(w))) return "high";
  if (MEDIUM_WORDS.some((w) => lower.includes(w))) return "medium";
  return "low";
}

/**
 * GDELT's Goldstein scale scores each event from -10 (extreme conflict) to
 * +10 (extreme cooperation) — a real signal, not a guess, so GDELT-sourced
 * items use this instead of the keyword heuristic above.
 */
export function classifySeverityFromGoldstein(score: number): Severity {
  if (score <= -7) return "critical";
  if (score <= -3) return "high";
  if (score < 2) return "medium";
  return "low";
}
