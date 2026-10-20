import type { SitrepEvent } from "@/lib/types";
import { Ticker } from "@/components/layout/Ticker";

export function TopBar({ events }: { events: SitrepEvent[] }) {
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
        <span className="font-mono text-[10px] text-ink-faint">
          {events.length} TRACKED EVENTS
        </span>
      </div>
      <Ticker events={events} />
    </header>
  );
}
