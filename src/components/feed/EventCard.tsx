"use client";

import type { SitrepEvent } from "@/lib/types";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { SeverityDot } from "@/components/ui/SeverityDot";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { cn } from "@/lib/cn";

export function EventCard({
  event,
  active,
  onSelect,
}: {
  event: SitrepEvent;
  active?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className={cn(
        "w-full rounded-lg border border-transparent p-3 text-left transition-colors",
        "hover:border-border hover:bg-surface-2",
        active && "border-border-strong bg-surface-2",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <CategoryBadge category={event.category} />
        <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-ink-faint">
          <SeverityDot severity={event.severity} />
          <TimeAgo iso={event.publishedAt} />
        </span>
      </div>
      <p className="text-sm leading-snug font-medium text-ink">
        {event.title}
      </p>
      <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-ink-faint">
        {event.country} · {event.source}
      </p>
    </button>
  );
}
