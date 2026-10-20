"use client";

import { useMemo, useState } from "react";
import { History, Radio, Rss, Search } from "lucide-react";
import type { SitrepEvent } from "@/lib/types";
import { EventCard } from "@/components/feed/EventCard";
import { Timeline } from "@/components/feed/Timeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeedCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type ViewMode = "feed" | "timeline";

export function FeedPanel({
  events,
  timelineEvents,
  now,
  selectedEventId,
  onSelect,
  loading = false,
  error = null,
  onRetry,
}: {
  /** Already restricted to the active time-window filter (1h/24h/3d/7d). */
  events: SitrepEvent[];
  /** Category/severity/country-filtered, but spans the full 7-day window regardless of the time-window filter — for the Timeline view. */
  timelineEvents: SitrepEvent[];
  now: number | null;
  selectedEventId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("feed");

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? events.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.country.toLowerCase().includes(q) ||
            e.source.toLowerCase().includes(q),
        )
      : events;
    return [...filtered].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }, [events, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-mono text-xs tracking-widest text-ink-muted uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-online" />
          </span>
          {view === "feed" ? "Live Feed" : "7-Day Timeline"}
        </h2>
        <span className="font-mono text-[10px] text-ink-faint">
          {view === "feed" ? sorted.length : timelineEvents.length} items
        </span>
      </div>

      <div className="flex items-center gap-1 border-b border-border p-1.5">
        {(["feed", "timeline"] as ViewMode[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-mono text-[10px] tracking-wide uppercase transition-colors",
              view === v ? "bg-surface-2 text-ink" : "text-ink-faint hover:text-ink",
            )}
          >
            {v === "feed" ? <Rss className="size-3" aria-hidden /> : <History className="size-3" aria-hidden />}
            {v === "feed" ? "Feed" : "Timeline"}
          </button>
        ))}
      </div>

      {view === "feed" && (
        <div className="border-b border-border p-2">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headlines, country, source…"
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </label>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <ErrorState onRetry={onRetry} />
        ) : loading ? (
          <div className="space-y-1.5 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <FeedCardSkeleton key={i} />
            ))}
          </div>
        ) : view === "timeline" ? (
          now === null ? null : (
            <Timeline events={timelineEvents} now={now} selectedEventId={selectedEventId} onSelect={onSelect} />
          )
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No items match"
            description={
              query
                ? "Try a different search term, or clear it."
                : "Try enabling more categories in the filter panel."
            }
          />
        ) : (
          <div className="space-y-1.5 p-2">
            {sorted.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                active={event.id === selectedEventId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
