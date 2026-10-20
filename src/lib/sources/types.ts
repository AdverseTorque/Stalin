import type { EventCategory, Severity } from "@/lib/types";

export type SourceType = "gdelt" | "rss" | "api" | "telegram";

export interface NormalizedItem {
  source: string;
  sourceType: SourceType;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  category: EventCategory;
  severity: Severity;
  /** null when the item names no single country (see lib/sources/place.ts). */
  lat: number | null;
  lng: number | null;
  country: string;
  continent: string;
  tags: string[];
}

export interface SourceAdapter {
  name: string;
  type: SourceType;
  homepageUrl: string;
  termsUrl: string;
  /** False sources are listed in the registry (and SOURCES.md) but skipped by the ingestion run — e.g. an API key isn't configured yet. */
  enabled: () => boolean;
  fetch: () => Promise<NormalizedItem[]>;
}
