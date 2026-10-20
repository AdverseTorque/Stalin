"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { CATEGORY_HEX, SEVERITY_ORDER, type SitrepEvent } from "@/lib/types";
import { MAP_HEIGHT, MAP_WIDTH, project } from "@/lib/geo/projection";
import { cn } from "@/lib/cn";

// Flat 2D world map replacing the 3D globe (user request — the globe's
// three.js engine, 470KB of country shapes and geometry building stalled
// the whole UI on load). The map itself is a static SVG drawn at build time
// (scripts/build-world-map.mjs, official Indian boundaries); only the event
// markers are rendered live. Zoom/pan just changes the SVG viewBox.

interface View {
  x: number;
  y: number;
  w: number;
}

const FULL_VIEW: View = { x: 0, y: 0, w: MAP_WIDTH };
const ASPECT = MAP_HEIGHT / MAP_WIDTH;
const MIN_W = MAP_WIDTH / 10; // max 10x zoom
const INDIA_VIEW: View = (() => {
  const c = project(22, 80);
  const w = MAP_WIDTH / 4;
  return { x: c.x - w / 2, y: c.y - (w * ASPECT) / 2, w };
})();

function clampView(v: View): View {
  const w = Math.min(MAP_WIDTH, Math.max(MIN_W, v.w));
  const h = w * ASPECT;
  return {
    w,
    x: Math.min(MAP_WIDTH - w, Math.max(0, v.x)),
    y: Math.min(MAP_HEIGHT - h, Math.max(0, v.y)),
  };
}

interface MarkerGroup {
  key: string;
  x: number;
  y: number;
  events: SitrepEvent[];
  lead: SitrepEvent; // most severe, then most recent — sets the colour
  hasCritical: boolean;
}

/**
 * Events at (nearly) the same coordinates are grouped into one numbered
 * marker. Many sources only know the country, so hundreds of India stories
 * share New Delhi's coordinates — individually they'd be one invisible
 * stack of 300 dots.
 */
function groupEvents(events: SitrepEvent[]): MarkerGroup[] {
  const groups = new Map<string, SitrepEvent[]>();
  for (const e of events) {
    const key = `${e.lat.toFixed(1)},${e.lng.toFixed(1)}`;
    const list = groups.get(key);
    if (list) list.push(e);
    else groups.set(key, [e]);
  }
  return [...groups.entries()].map(([key, list]) => {
    const lead = [...list].sort(
      (a, b) =>
        SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )[0];
    const { x, y } = project(lead.lat, lead.lng);
    return { key, x, y, events: list, lead, hasCritical: list.some((e) => e.severity === "critical") };
  });
}

export const WorldMap = memo(function WorldMap({
  events,
  selectedEventId,
  onSelectEvent,
  countryFilter,
  onSelectCountry,
  loading = false,
}: {
  events: SitrepEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  countryFilter: string | null;
  onSelectCountry: (country: string) => void;
  loading?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(FULL_VIEW);
  const drag = useRef<{ px: number; py: number; view: View; moved: boolean } | null>(null);

  // Larger groups draw first so small ones stay clickable on top.
  const groups = useMemo(
    () => groupEvents(events).sort((a, b) => b.events.length - a.events.length),
    [events],
  );

  // Screen px -> map units at the current zoom.
  const unitsPerPx = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 1;
    // preserveAspectRatio="meet": the map is fit by whichever axis is tighter.
    return Math.max(view.w / rect.width, (view.w * ASPECT) / rect.height);
  }, [view.w]);

  const zoomAt = useCallback((factor: number, cx = 0.5, cy = 0.5) => {
    setView((v) => {
      const w = Math.min(MAP_WIDTH, Math.max(MIN_W, v.w * factor));
      const h = w * ASPECT;
      return clampView({ w, x: v.x + (v.w - w) * cx, y: v.y + (v.w * ASPECT - h) * cy });
    });
  }, []);

  // Wheel zoom around the cursor. Registered manually because React's
  // onWheel is passive, so it can't stop the page from scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      zoomAt(e.deltaY > 0 ? 1.2 : 1 / 1.2, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, view, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < 4) return; // still a click, not a drag
    if (!d.moved) svgRef.current?.setPointerCapture(e.pointerId);
    d.moved = true;
    const k = unitsPerPx();
    setView(clampView({ w: d.view.w, x: d.view.x - dx * k, y: d.view.y - dy * k }));
  };
  const onPointerUp = () => {
    // Defer clearing so the marker's click handler can still see `moved`.
    setTimeout(() => (drag.current = null), 0);
  };

  const onMarkerClick = (g: MarkerGroup) => {
    if (drag.current?.moved) return; // end of a pan, not a click
    if (g.events.length === 1) onSelectEvent(g.lead.id);
    else onSelectCountry(g.lead.country); // filters the feed to pick from
  };

  // Keep markers the same size on screen at any zoom level.
  const scale = view.w / MAP_WIDTH;
  const zoomed = view.w < MAP_WIDTH;

  return (
    <div className="relative h-full w-full overflow-hidden bg-canvas">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.w * ASPECT}`}
        preserveAspectRatio="xMidYMid meet"
        className={cn("h-full w-full touch-none select-none", zoomed ? "cursor-grab active:cursor-grabbing" : "")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={() => setView(FULL_VIEW)}
        role="img"
        aria-label="World map of tracked events"
      >
        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0a1a36" />
        <image href="/data/world-map.svg" x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} />

        {groups.map((g) => {
          const count = g.events.length;
          const r = (3 + Math.min(7, Math.sqrt(count) * 1.4)) * scale * 1.6;
          const color = CATEGORY_HEX[g.lead.category];
          const selected = selectedEventId !== null && g.events.some((e) => e.id === selectedEventId);
          const filtered = countryFilter !== null && g.lead.country === countryFilter;
          return (
            <g
              key={g.key}
              className="cursor-pointer"
              onClick={() => onMarkerClick(g)}
              role="button"
              aria-label={count === 1 ? g.lead.title : `${g.lead.country}: ${count} events`}
            >
              <title>{count === 1 ? g.lead.title : `${g.lead.country} — ${count} events (click to filter)`}</title>
              {g.hasCritical && (
                <circle
                  cx={g.x}
                  cy={g.y}
                  r={r}
                  fill="none"
                  stroke={CATEGORY_HEX.conflict}
                  strokeWidth={1.2 * scale}
                  className="animate-ping"
                  style={{ transformBox: "fill-box", transformOrigin: "center", animationDuration: "2s" }}
                />
              )}
              <circle
                cx={g.x}
                cy={g.y}
                r={r}
                fill={color}
                fillOpacity={0.85}
                stroke={selected || filtered ? "#ffffff" : "rgba(10,16,34,0.9)"}
                strokeWidth={(selected || filtered ? 1.6 : 0.8) * scale}
              />
              {count > 1 && (
                <text
                  x={g.x}
                  y={g.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={r * 0.95}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={600}
                  fill="#0a1022"
                  pointerEvents="none"
                >
                  {count > 99 ? "99+" : count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {[
          { label: "Zoom in", icon: Plus, onClick: () => zoomAt(1 / 1.5) },
          { label: "Zoom out", icon: Minus, onClick: () => zoomAt(1.5) },
          { label: "Reset view", icon: RotateCcw, onClick: () => setView(FULL_VIEW) },
        ].map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className="flex size-8 items-center justify-center rounded-md border border-border-strong bg-canvas/85 text-ink-muted backdrop-blur-sm hover:text-ink"
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setView(clampView(INDIA_VIEW))}
          title="Focus on India"
          className="flex h-8 items-center justify-center rounded-md border border-border-strong bg-canvas/85 px-1 font-mono text-[9px] tracking-wide text-ink-muted uppercase backdrop-blur-sm hover:text-ink"
        >
          India
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full border border-border-strong bg-canvas/80 px-3 py-1 font-mono text-[10px] text-ink-muted backdrop-blur-sm">
          {loading ? (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
              Loading live events…
            </>
          ) : selectedEventId ? (
            "Event selected — see detail panel"
          ) : countryFilter ? (
            <>Showing {countryFilter} — clear it in Filters</>
          ) : (
            "Scroll to zoom · drag to pan · click a dot for details, a number to filter"
          )}
        </span>
      </div>
    </div>
  );
});
