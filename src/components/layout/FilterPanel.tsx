"use client";

import { SlidersHorizontal, X } from "lucide-react";
import {
  CATEGORY_COLOR_VAR,
  CATEGORY_LABEL,
  SEVERITY_LABEL,
  TIME_WINDOW_LABEL,
  type EventCategory,
  type Severity,
  type TimeWindow,
} from "@/lib/types";
import { cn } from "@/lib/cn";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];
const TIME_WINDOWS = Object.keys(TIME_WINDOW_LABEL) as TimeWindow[];
const SEVERITY_THRESHOLDS: Severity[] = ["low", "medium", "high", "critical"];

export function FilterPanel({
  activeCategories,
  onToggleCategory,
  timeWindow,
  onChangeTimeWindow,
  minSeverity,
  onChangeMinSeverity,
  countryFilter,
  onClearCountryFilter,
}: {
  activeCategories: Set<EventCategory>;
  onToggleCategory: (category: EventCategory) => void;
  timeWindow: TimeWindow;
  onChangeTimeWindow: (w: TimeWindow) => void;
  minSeverity: Severity;
  onChangeMinSeverity: (s: Severity) => void;
  countryFilter: string | null;
  onClearCountryFilter: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SlidersHorizontal className="size-3.5 text-ink-muted" aria-hidden />
        <h2 className="font-mono text-xs tracking-widest text-ink-muted uppercase">
          Filters
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {countryFilter && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-2">
            <span className="font-mono text-xs text-accent">{countryFilter}</span>
            <button
              type="button"
              onClick={onClearCountryFilter}
              aria-label="Clear country filter"
              className="rounded-full p-0.5 text-accent hover:bg-accent/20"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}

        <p className="mb-2 font-mono text-[10px] tracking-wide text-ink-faint uppercase">
          Category
        </p>
        <div className="flex flex-col gap-1.5">
          {ALL_CATEGORIES.map((category) => {
            const colorVar = `var(${CATEGORY_COLOR_VAR[category]})`;
            const isActive = activeCategories.has(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => onToggleCategory(category)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                  isActive
                    ? "border-border-strong bg-surface-2 text-ink"
                    : "border-transparent text-ink-faint hover:bg-surface-2/60",
                )}
              >
                <span
                  className="size-2 shrink-0 rounded-full transition-opacity"
                  style={{
                    backgroundColor: colorVar,
                    opacity: isActive ? 1 : 0.35,
                  }}
                  aria-hidden
                />
                {CATEGORY_LABEL[category]}
              </button>
            );
          })}
        </div>

        <p className="mt-6 mb-2 font-mono text-[10px] tracking-wide text-ink-faint uppercase">
          Time window
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onChangeTimeWindow(w)}
              aria-pressed={timeWindow === w}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors",
                timeWindow === w
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-ink-faint hover:text-ink",
              )}
            >
              {TIME_WINDOW_LABEL[w]}
            </button>
          ))}
        </div>

        <p className="mt-6 mb-2 font-mono text-[10px] tracking-wide text-ink-faint uppercase">
          Minimum severity
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_THRESHOLDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeMinSeverity(s)}
              aria-pressed={minSeverity === s}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors",
                minSeverity === s
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-ink-faint hover:text-ink",
              )}
            >
              {SEVERITY_LABEL[s]}+
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
