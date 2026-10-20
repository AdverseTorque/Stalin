"use client";

import { timeAgo } from "@/lib/time";
import { useNow } from "@/lib/useNow";

/**
 * Renders a relative "Xm ago" string. `Date.now()` is an unstable value that
 * Next.js 16's cacheComponents prerendering refuses to bake into static
 * HTML, so the read is deferred to useNow() (also avoids a server/client
 * hydration mismatch, since "now" differs between the two).
 */
export function TimeAgo({ iso }: { iso: string }) {
  const now = useNow();
  return <>{now === null ? "…" : timeAgo(iso, now)}</>;
}
