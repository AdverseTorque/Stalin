"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { AlertTriangle } from "lucide-react";
import { CATEGORY_HEX, SEVERITY_WEIGHT, type SitrepEvent } from "@/lib/types";
import { isWebGLAvailable } from "@/lib/webgl";
import { resolveCountryName, useCountryShapes, type CountryFeature } from "@/lib/geo/countryShapes";
import { createStarfield, type Starfield } from "@/components/globe/starfield";
import { EmptyState } from "@/components/ui/EmptyState";

// react-globe.gl touches `window`/WebGL at module load time, so it must never
// be evaluated during server rendering — even inside this Client Component,
// Next.js still server-renders an initial HTML pass unless ssr is disabled.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// Political-map palette, indexed by Natural Earth's MAPCOLOR7 (1–7), which
// already guarantees neighbouring countries never share a colour. Muted
// atlas tones tuned to sit on the dark navy ocean without going flat/black.
const MAP_PALETTE = ["#3e5f80", "#4c705f", "#6c5c84", "#806e4f", "#4e7380", "#80566a", "#5f7048"];
const OCEAN = "#0a1a36";
const BORDER = "rgba(226, 232, 240, 0.38)";
const BORDER_FILTERED = "#7dd3fc";
const HOVER_TINT = "#38bdf8";

// Altitudes are layered so markers/rings always sit above any country
// shape, even a raised (hovered) one — otherwise a hovered country would
// swallow low-severity markers on it.
const ALT_BASE = 0.005;
const ALT_ACTIVE = 0.009;
const ALT_HOVER = 0.016;
const ALT_RINGS = 0.018;
const ALT_POINT_MIN = 0.022;

function mix(hex: string, target: string, t: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(target.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

// Flat-colour ocean instead of the old photographic earth texture — the
// country shapes now carry the land, so the sphere itself is just sea.
// Created lazily, and only from inside the client-only Globe branch:
// Three.js assigns every material a random UUID (Math.random()), which
// Next.js 16's cacheComponents refuses to evaluate during prerendering.
// One shared instance for the app's lifetime — the globe mounts once.
let oceanMaterial: THREE.MeshPhongMaterial | null = null;
function getOceanMaterial(): THREE.MeshPhongMaterial {
  oceanMaterial ??= new THREE.MeshPhongMaterial({ color: OCEAN, emissive: "#061024", shininess: 6 });
  return oceanMaterial;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function GlobeView({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const starfieldRef = useRef<Starfield | null>(null);
  const starfieldRafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const countries = useCountryShapes();

  useEffect(() => {
    // One-time browser-capability probe on mount, not state synchronized
    // from a changing external source — the lint rule's cascading-render
    // concern doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebglOk(isWebGLAvailable());
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const criticalRings = useMemo(
    () => events.filter((e) => e.severity === "critical"),
    [events],
  );

  const eventCountByCountry = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) counts.set(e.country, (counts.get(e.country) ?? 0) + 1);
    return counts;
  }, [events]);

  const countryColor = (f: CountryFeature) => {
    const base = MAP_PALETTE[(f.properties.mapColor - 1 + MAP_PALETTE.length) % MAP_PALETTE.length];
    if (f === hovered) return mix(base, HOVER_TINT, 0.45);
    const active = eventCountByCountry.has(resolveCountryName(f));
    return active ? mix(base, "#ffffff", 0.2) : base;
  };

  const countryAltitude = (f: CountryFeature) => {
    if (f === hovered) return ALT_HOVER;
    return eventCountByCountry.has(resolveCountryName(f)) ? ALT_ACTIVE : ALT_BASE;
  };

  const countryLabel = (f: CountryFeature) => {
    const name = resolveCountryName(f);
    const count = eventCountByCountry.get(name) ?? 0;
    return `<div style="padding:4px 8px;border-radius:6px;background:rgba(10,16,34,0.9);border:1px solid rgba(148,163,184,0.3);font:12px ui-monospace,monospace;color:#e7ecf6">
      ${escapeHtml(name)}<span style="color:#9aa8c4"> · ${count} event${count === 1 ? "" : "s"}</span>
    </div>`;
  };

  const handleGlobeReady = () => {
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableDamping = true;
    }
    // Centered roughly on the Indian Ocean so Asia/Africa/Europe are all in
    // view on first load — matches "South Asia / India is my priority".
    globeRef.current?.pointOfView({ lat: 15, lng: 55, altitude: 2.2 }, 0);

    // Injected into the globe's own scene (one WebGL context, no second
    // renderer) — see starfield.ts for why. Confined entirely to this
    // component, so no other panel is affected.
    const scene = globeRef.current?.scene();
    if (scene && !starfieldRef.current) {
      const starfield = createStarfield();
      scene.add(starfield.points);
      starfieldRef.current = starfield;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduceMotion) {
        const tick = (t: number) => {
          starfield.setTime(t / 1000);
          starfieldRafRef.current = requestAnimationFrame(tick);
        };
        starfieldRafRef.current = requestAnimationFrame(tick);
      }
    }
  };

  // Pause auto-rotation while a country is hovered, so it doesn't slide
  // out from under the cursor mid-read.
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (controls) controls.autoRotate = hovered === null;
  }, [hovered]);

  useEffect(() => {
    return () => {
      if (starfieldRafRef.current !== null) cancelAnimationFrame(starfieldRafRef.current);
      if (starfieldRef.current) {
        // globeRef.current is set asynchronously by react-globe.gl well
        // after this effect's setup runs (the globe loads in the
        // background) — there's nothing meaningful to capture at mount
        // time, so reading the live ref value here at cleanup is correct,
        // not stale.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        globeRef.current?.scene()?.remove(starfieldRef.current.points);
        starfieldRef.current.dispose();
        starfieldRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-canvas">
      {/* Nebula wash — pure CSS, no WebGL/render cost, sits behind the
          globe's own transparent-background canvas. Confined to this
          panel only. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 20%, color-mix(in oklch, #7c3aed 18%, transparent), transparent 70%)," +
            "radial-gradient(ellipse 55% 45% at 75% 80%, color-mix(in oklch, #0ea5e9 16%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      {webglOk === false ? (
        <EmptyState
          icon={AlertTriangle}
          title="3D globe unavailable on this device"
          description="Your browser or device doesn't support WebGL. A lightweight 2D map fallback is planned for a later phase — for now, use the Feed tab for the same events."
        />
      ) : size.width > 0 && size.height > 0 ? (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={null}
          globeMaterial={getOceanMaterial()}
          atmosphereColor="#38bdf8"
          atmosphereAltitude={0.2}
          onGlobeReady={handleGlobeReady}
          polygonsData={countries}
          polygonCapColor={(d) => countryColor(d as CountryFeature)}
          polygonSideColor={() => "rgba(8, 14, 30, 0.75)"}
          polygonStrokeColor={(d) =>
            countryFilter && resolveCountryName(d as CountryFeature) === countryFilter ? BORDER_FILTERED : BORDER
          }
          polygonAltitude={(d) => countryAltitude(d as CountryFeature)}
          polygonsTransitionDuration={250}
          polygonLabel={(d) => countryLabel(d as CountryFeature)}
          onPolygonHover={(d) => setHovered((d as CountryFeature | null) ?? null)}
          onPolygonClick={(d) => onSelectCountry(resolveCountryName(d as CountryFeature))}
          pointsData={events}
          pointLat={(d) => (d as SitrepEvent).lat}
          pointLng={(d) => (d as SitrepEvent).lng}
          pointColor={(d) => CATEGORY_HEX[(d as SitrepEvent).category]}
          pointAltitude={(d) => ALT_POINT_MIN + SEVERITY_WEIGHT[(d as SitrepEvent).severity] * 0.03}
          pointRadius={(d) => 0.35 + SEVERITY_WEIGHT[(d as SitrepEvent).severity] * 0.55}
          pointLabel={(d) => escapeHtml((d as SitrepEvent).title)}
          onPointClick={(d) => onSelectEvent((d as SitrepEvent).id)}
          ringsData={criticalRings}
          ringLat={(d) => (d as SitrepEvent).lat}
          ringLng={(d) => (d as SitrepEvent).lng}
          ringAltitude={ALT_RINGS}
          ringColor={() => CATEGORY_HEX.conflict}
          ringMaxRadius={3}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1400}
        />
      ) : null}

      {webglOk !== false && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full border border-border-strong bg-canvas/80 px-3 py-1 font-mono text-[10px] text-ink-muted backdrop-blur-sm">
            {loading ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
                Loading live events…
              </>
            ) : selectedEventId ? (
              "Marker selected — see detail panel"
            ) : countryFilter ? (
              <>Showing {countryFilter} — click it again to clear</>
            ) : (
              "Click a country to filter · click a marker for details"
            )}
          </span>
        </div>
      )}
    </div>
  );
}
