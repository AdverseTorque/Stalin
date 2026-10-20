"use client";

import { useMemo, useState } from "react";
import { Radio, Search } from "lucide-react";
import type { SitrepEvent } from "@/lib/types";
import { EventCard } from "@/components/feed/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeedCardSkeleton } from "@/components/ui/Skeleton";

export function FeedPanel({
  events,
  selectedEventId,
  onSelect,
  loading = false,
  error = null,
  onRetry,
}: {
  events: SitrepEvent[];
  selectedEventId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [query, setQuery] = useState("");

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
          Live Feed
        </h2>
        <span className="font-mono text-[10px] text-ink-faint">
          {sorted.length} items
        </span>
      </div>

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

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {error ? (
          <ErrorState onRetry={onRetry} />
        ) : loading ? (
          Array.from({ length: 6 }).map((_, i) => <FeedCardSkeleton key={i} />)
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
          sorted.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              active={event.id === selectedEventId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
