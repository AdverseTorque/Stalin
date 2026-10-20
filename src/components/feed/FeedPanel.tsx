"use client";

import { Radio } from "lucide-react";
import type { SitrepEvent } from "@/lib/types";
import { EventCard } from "@/components/feed/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function FeedPanel({
  events,
  selectedEventId,
  onSelect,
}: {
  events: SitrepEvent[];
  selectedEventId: string | null;
  onSelect: (id: string) => void;
}) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-mono text-xs tracking-widest text-ink-muted uppercase">
          Live Feed
        </h2>
        <span className="font-mono text-[10px] text-ink-faint">
          {sorted.length} items
        </span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No items match your filters"
            description="Try enabling more categories in the filter panel."
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
