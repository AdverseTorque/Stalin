import type { SitrepEvent } from "@/lib/types";
import { CATEGORY_COLOR_VAR } from "@/lib/types";

export function Ticker({ events }: { events: SitrepEvent[] }) {
  const flash = events
    .filter((e) => e.severity === "high" || e.severity === "critical")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (flash.length === 0) return null;

  // Duplicate the list so the CSS marquee loops seamlessly.
  const loop = [...flash, ...flash];

  // A fixed duration regardless of list length means more flash items =
  // faster effective scroll speed (same distance covered in the same
  // time) — that's the real reason this felt "too fast" as more
  // high/critical items accumulated. ~5.5s of screen-time per item at a
  // comfortable reading pace, with a floor so a short list doesn't rush by.
  const durationSeconds = Math.max(flash.length * 5.5, 30);

  return (
    <div className="group relative flex h-8 items-center overflow-hidden border-b border-border bg-surface">
      <span className="relative z-10 flex h-full shrink-0 items-center gap-1.5 border-r border-border bg-surface px-3 font-mono text-[10px] font-semibold tracking-widest text-red-300 uppercase shadow-[4px_0_8px_-2px_rgba(0,0,0,0.4)]">
        <span className="size-1.5 animate-pulse rounded-full bg-red-400" aria-hidden />
        News Flash
      </span>
      <div
        className="flex shrink-0 animate-[marquee_linear_infinite] items-center gap-8 pl-8 whitespace-nowrap group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((event, i) => (
          <span
            key={`${event.id}-${i}`}
            className="flex items-center gap-2 font-mono text-xs text-ink-muted"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: `var(${CATEGORY_COLOR_VAR[event.category]})` }}
              aria-hidden
            />
            <span className="text-ink">{event.title}</span>
            <span className="text-ink-faint">· {event.country}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
