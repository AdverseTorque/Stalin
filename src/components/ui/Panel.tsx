import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Base elevated-surface card used throughout the dashboard (sidebars, feed
 * cards, detail panels). Gives the "ops-room" layered-glass look: a lighter
 * navy surface, soft border, subtle shadow — deliberately not flat black.
 */
export function Panel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/80 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
