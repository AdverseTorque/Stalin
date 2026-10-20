"use client";

import { useEffect, useState } from "react";

/**
 * A client-only "current time" tick, refreshed every minute. Needed
 * wherever filtering/sorting depends on Date.now() (e.g. the time-window
 * filter) — computing it directly during render would read an unstable
 * value during Next.js 16's cacheComponents prerendering (see TimeAgo.tsx
 * for the same issue in miniature). Returns null until mounted; callers
 * should treat that as "don't apply time-based filtering yet" so the first
 * client render still matches the server's trivial (empty-data) render.
 */
export function useNow(intervalMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
