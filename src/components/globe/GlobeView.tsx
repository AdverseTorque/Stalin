"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import { AlertTriangle } from "lucide-react";
import { CATEGORY_HEX, SEVERITY_WEIGHT, type SitrepEvent } from "@/lib/types";
import { isWebGLAvailable } from "@/lib/webgl";
import { createStarfield, type Starfield } from "@/components/globe/starfield";
import { EmptyState } from "@/components/ui/EmptyState";

// react-globe.gl touches `window`/WebGL at module load time, so it must never
// be evaluated during server rendering — even inside this Client Component,
// Next.js still server-renders an initial HTML pass unless ssr is disabled.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const GLOBE_TEXTURE = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";

export function GlobeView({
  events,
  selectedEventId,
  onSelectEvent,
  loading = false,
}: {
  events: SitrepEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  loading?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const starfieldRef = useRef<Starfield | null>(null);
  const starfieldRafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

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
          globeImageUrl={GLOBE_TEXTURE}
          atmosphereColor="#38bdf8"
          atmosphereAltitude={0.22}
          onGlobeReady={handleGlobeReady}
          pointsData={events}
          pointLat={(d) => (d as SitrepEvent).lat}
          pointLng={(d) => (d as SitrepEvent).lng}
          pointColor={(d) => CATEGORY_HEX[(d as SitrepEvent).category]}
          pointAltitude={(d) =>
            0.01 + SEVERITY_WEIGHT[(d as SitrepEvent).severity] * 0.03
          }
          pointRadius={(d) =>
            0.35 + SEVERITY_WEIGHT[(d as SitrepEvent).severity] * 0.55
          }
          pointLabel={(d) => (d as SitrepEvent).title}
          onPointClick={(d) => onSelectEvent((d as SitrepEvent).id)}
          ringsData={criticalRings}
          ringLat={(d) => (d as SitrepEvent).lat}
          ringLng={(d) => (d as SitrepEvent).lng}
          ringColor={() => CATEGORY_HEX.conflict}
          ringMaxRadius={3}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1400}
        />
      ) : null}

      {webglOk !== false && (loading || selectedEventId) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full border border-border-strong bg-canvas/80 px-3 py-1 font-mono text-[10px] text-ink-muted backdrop-blur-sm">
            {loading ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
                Loading live events…
              </>
            ) : (
              "Marker selected — see detail panel"
            )}
          </span>
        </div>
      )}
    </div>
  );
}
