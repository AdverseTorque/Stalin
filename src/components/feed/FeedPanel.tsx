"use client";

import { memo, useMemo, useState } from "react";
import { History, Newspaper, Radio, Rss, Search, Send } from "lucide-react";
import { RETENTION_DAYS } from "@/lib/retention";
import type { SitrepEvent } from "@/lib/types";
import { EventCard } from "@/components/feed/EventCard";
import { Timeline } from "@/components/feed/Timeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeedCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type ViewMode = "feed" | "timeline";
// "news" = every non-Telegram source (RSS, GDELT, news APIs) — the feed as it
// always was; "telegram" = the Telegram channels, kept apart because they are
// high-volume, often non-English, and usually have no map position.
type Channel = "news" | "telegram";
const PAGE_SIZE = 100;

function splitByChannel(list: SitrepEvent[]): Record<Channel, SitrepEvent[]> {
  const out: Record<Channel, SitrepEvent[]> = { news: [], telegram: [] };
  for (const e of list) out[e.sourceType === "telegram" ? "telegram" : "news"].push(e);
  return out;
}

function FeedPanelImpl({
  events,
  timelineEvents,
  now,
  selectedEventId,
  onSelect,
  loading = false,
  error = null,
  onRetry,
}: {
  /** Already restricted to the active time-window filter (1h/24h/2d). */
  events: SitrepEvent[];
  /** Category/severity/country-filtered, but spans the full retention window regardless of the time-window filter — for the Timeline view. */
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
  // Rendering ~2,000 cards at once made the UI sluggish; show a page at a time.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [channel, setChannel] = useState<Channel>("news");

  const feedByChannel = useMemo(() => splitByChannel(events), [events]);
  const timelineByChannel = useMemo(() => splitByChannel(timelineEvents), [timelineEvents]);
  const counts = view === "feed" ? feedByChannel : timelineByChannel;
  const channelTimeline = timelineByChannel[channel];

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const channelEvents = feedByChannel[channel];
    const filtered = q
      ? channelEvents.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.country.toLowerCase().includes(q) ||
            e.source.toLowerCase().includes(q),
        )
      : channelEvents;
    return [...filtered].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }, [feedByChannel, channel, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-mono text-xs tracking-widest text-ink-muted uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-online" />
          </span>
          {view === "feed" ? "Live Feed" : `${RETENTION_DAYS}-Day Timeline`}
        </h2>
        <span className="font-mono text-[10px] text-ink-faint">
          {view === "feed" ? sorted.length : channelTimeline.length} items
        </span>
      </div>

      <div className="flex items-center gap-1 border-b border-border p-1.5" role="tablist" aria-label="Feed source">
        {(
          [
            { id: "news", label: "News", Icon: Newspaper },
            { id: "telegram", label: "Telegram", Icon: Send },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={channel === id}
            onClick={() => {
              setChannel(id);
              setVisibleCount(PAGE_SIZE); // other tab starts from its top page
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-mono text-[10px] tracking-wide uppercase transition-colors",
              channel === id ? "bg-accent/15 text-accent" : "text-ink-faint hover:text-ink",
            )}
          >
            <Icon className="size-3" aria-hidden />
            {label}
            <span className="text-ink-faint">{counts[id].length}</span>
          </button>
        ))}
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
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE); // new search starts from the top page
              }}
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
            <Timeline events={channelTimeline} now={now} selectedEventId={selectedEventId} onSelect={onSelect} />
          )
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No items match"
            description={
              query
                ? "Try a different search term, or clear it."
                : channel === "telegram"
                  ? "No Telegram posts in this time window — try a wider one, or enable more categories."
                  : "Try enabling more categories in the filter panel."
            }
          />
        ) : (
          <div className="space-y-1.5 p-2">
            {sorted.slice(0, visibleCount).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                active={event.id === selectedEventId}
                onSelect={onSelect}
              />
            ))}
            {sorted.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="w-full rounded-lg border border-border py-2 font-mono text-[11px] text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
              >
                Show more ({sorted.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// memo: AppShell re-renders on every streamed Stalin token; this panel only
// needs to re-render when its own props change.
export const FeedPanel = memo(FeedPanelImpl);
