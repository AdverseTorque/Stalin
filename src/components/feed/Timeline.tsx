"use client";

import { useMemo, useState } from "react";
import type { SitrepEvent } from "@/lib/types";
import { EventCard } from "@/components/feed/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { History } from "lucide-react";

const PER_DAY = 30;

function dayLabel(dateMs: number, now: number): string {
  const diffDays = Math.floor((startOfDay(now) - startOfDay(dateMs)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 0) return "Today"; // clock skew guard
  return new Date(dateMs).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Groups events by calendar day across the full 7-day retention window —
 * independent of the quick time-window filter (1h/24h/3d/7d), which only
 * governs the live Feed list/globe. Still respects category/severity/
 * country filters, so "show me this week's shape of X" works.
 */
export function Timeline({
  events,
  now,
  selectedEventId,
  onSelect,
}: {
  events: SitrepEvent[];
  now: number;
  selectedEventId: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const byDay = new Map<number, SitrepEvent[]>();
    for (const e of events) {
      const key = startOfDay(new Date(e.publishedAt).getTime());
      const bucket = byDay.get(key);
      if (bucket) bucket.push(e);
      else byDay.set(key, [e]);
    }
    for (const list of byDay.values()) {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return [...byDay.entries()].sort((a, b) => b[0] - a[0]);
  }, [events]);
  // Each day shows its newest PER_DAY items until expanded — a busy day can
  // have hundreds, and rendering all of them made the panel sluggish.
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No items in the last 7 days"
        description="Try enabling more categories or clearing the country filter."
      />
    );
  }

  return (
    <div className="space-y-5 p-2">
      {groups.map(([dayMs, dayEvents]) => (
        <div key={dayMs}>
          <div className="mb-1.5 flex items-center gap-2 px-2">
            <h3 className="font-mono text-[11px] font-semibold tracking-wide text-ink uppercase">
              {dayLabel(dayMs, now)}
            </h3>
            <span className="font-mono text-[10px] text-ink-faint">
              {dayEvents.length} item{dayEvents.length === 1 ? "" : "s"}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-1.5">
            {(expanded.has(dayMs) ? dayEvents : dayEvents.slice(0, PER_DAY)).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                active={event.id === selectedEventId}
                onSelect={onSelect}
              />
            ))}
            {dayEvents.length > PER_DAY && !expanded.has(dayMs) && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => new Set(prev).add(dayMs))}
                className="w-full rounded-lg border border-border py-1.5 font-mono text-[10px] text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
              >
                Show all {dayEvents.length} from this day
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
