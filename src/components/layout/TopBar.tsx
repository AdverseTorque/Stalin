import { memo } from "react";
import { CircleHelp, SlidersHorizontal } from "lucide-react";
import type { SitrepEvent } from "@/lib/types";
import { Ticker } from "@/components/layout/Ticker";
import { cn } from "@/lib/cn";

function TopBarImpl({
  events,
  dataSource,
  filtersActive,
  onOpenFilters,
  onOpenGuide,
}: {
  events: SitrepEvent[];
  dataSource: "live" | "mock" | null;
  /** Any filter narrowed from its default — marks the phone Filters button. */
  filtersActive: boolean;
  onOpenFilters: () => void;
  onOpenGuide: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-canvas/90 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-online" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-ink">
            SITREP
          </span>
          <span className="hidden font-mono text-[10px] text-ink-faint sm:inline">
            GLOBAL INTELLIGENCE COMMAND CENTER
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {dataSource && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase",
                dataSource === "live"
                  ? "border-online/40 bg-online/10 text-online"
                  : "border-amber-400/40 bg-amber-400/10 text-amber-300",
              )}
              title={
                dataSource === "mock"
                  ? "No live data yet — showing sample events until ingestion runs"
                  : "Serving live ingested data"
              }
            >
              {dataSource === "live" ? "Live Data" : "Sample Data"}
            </span>
          )}
          <span className="font-mono text-[10px] text-ink-faint">
            {events.length}
            <span className="hidden sm:inline"> TRACKED EVENTS</span>
            <span className="sm:hidden"> EVENTS</span>
          </span>
          {/* Phones have no filter sidebar — it opens as a sheet instead. */}
          <button
            type="button"
            onClick={onOpenFilters}
            className="relative flex items-center gap-1 rounded-md border border-border-strong px-2 py-1 font-mono text-[10px] text-ink-muted uppercase md:hidden"
          >
            <SlidersHorizontal className="size-3" aria-hidden />
            Filters
            {filtersActive && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent" aria-label="(filters on)" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenGuide}
            aria-label="How to use SITREP"
            title="How to use SITREP"
            className="rounded-full p-1 text-ink-muted hover:text-ink"
          >
            <CircleHelp className="size-4.5" aria-hidden />
          </button>
        </div>
      </div>
      <Ticker events={events} />
    </header>
  );
}

// memo: AppShell re-renders on every streamed Stalin token; this panel only
// needs to re-render when its own props change.
export const TopBar = memo(TopBarImpl);
