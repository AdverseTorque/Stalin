// Shared domain types for SITREP. Mirrors the `items` table design in PLAN.md
// §6 — kept intentionally small in Phase 2 since we're working with mock
// data; the real ingestion pipeline (Phase 3) will produce values in this
// exact shape.

export type EventCategory =
  | "unrest"
  | "conflict"
  | "economics"
  | "geopolitics"
  | "india";

export type Severity = "low" | "medium" | "high" | "critical";

export interface SitrepEvent {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string; // ISO timestamp
  category: EventCategory;
  severity: Severity;
  lat: number;
  lng: number;
  country: string;
  continent: string;
  tags: string[];
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  unrest: "Protests / Civil Unrest",
  conflict: "Armed Conflict / Terrorism",
  economics: "Global Economics",
  geopolitics: "Geopolitics / Diplomacy",
  india: "Indian Politics & Governance",
};

export const CATEGORY_COLOR_VAR: Record<EventCategory, string> = {
  unrest: "--color-cat-unrest",
  conflict: "--color-cat-conflict",
  economics: "--color-cat-economics",
  geopolitics: "--color-cat-geopolitics",
  india: "--color-cat-india",
};

// WebGL (the globe) can't resolve CSS var() — three.js colour parsing needs a
// literal value. Keep these in sync with the --color-cat-* tokens in
// globals.css; DOM components (badges, chips) should use CATEGORY_COLOR_VAR
// instead so they stay themeable from one place.
export const CATEGORY_HEX: Record<EventCategory, string> = {
  unrest: "#f59e0b",
  conflict: "#ef4444",
  economics: "#06b6d4",
  geopolitics: "#a78bfa",
  india: "#4ade80",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

// Relative glow/pulse intensity per severity — hue still carries category.
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 0.35,
  medium: 0.55,
  high: 0.75,
  critical: 1,
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export type NavTab = "map" | "feed" | "agents" | "upsc" | "stalin";

export const NAV_TABS: { id: NavTab; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "feed", label: "Feed" },
  { id: "agents", label: "Agents" },
  { id: "upsc", label: "UPSC" },
  { id: "stalin", label: "Stalin" },
];
