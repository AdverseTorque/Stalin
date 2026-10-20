import type { SitrepEvent } from "@/lib/types";
import { Ticker } from "@/components/layout/Ticker";
import { cn } from "@/lib/cn";

export function TopBar({
  events,
  dataSource,
}: {
  events: SitrepEvent[];
  dataSource: "live" | "mock" | null;
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
        <div className="flex items-center gap-3">
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
            {events.length} TRACKED EVENTS
          </span>
        </div>
      </div>
      <Ticker events={events} />
    </header>
  );
}
