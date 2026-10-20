"use client";

import { SlidersHorizontal } from "lucide-react";
import { CATEGORY_COLOR_VAR, CATEGORY_LABEL, type EventCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];

export function FilterPanel({
  activeCategories,
  onToggle,
}: {
  activeCategories: Set<EventCategory>;
  onToggle: (category: EventCategory) => void;
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
                onClick={() => onToggle(category)}
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
          {["1h", "24h", "3d", "7d"].map((label, i) => (
            <span
              key={label}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px]",
                i === 1
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-ink-faint",
              )}
            >
              {label}
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] text-ink-faint/70">
          Time-window and severity filtering arrive in Phase 4.
        </p>
      </div>
    </div>
  );
}
