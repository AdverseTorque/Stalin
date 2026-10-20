"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time";

/**
 * Renders a relative "Xm ago" string. `Date.now()` is an unstable value that
 * Next.js 16's cacheComponents prerendering refuses to bake into static
 * HTML, so the read is deferred to a client-only effect (also avoids a
 * server/client hydration mismatch, since "now" differs between the two).
 */
export function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(timeAgo(iso));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [iso]);

  // Stable placeholder for the prerendered/first-paint HTML; replaced after mount.
  return <>{label ?? "…"}</>;
}
