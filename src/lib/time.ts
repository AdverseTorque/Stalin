// `now` is always passed explicitly (from useNow()) rather than read via
// Date.now() in here — keeps every caller's "current time" consistent
// within a render and keeps this file safe to call from anywhere (no
// hidden dependency on an unstable global clock during Next.js's
// cacheComponents prerendering).
export function timeAgo(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
