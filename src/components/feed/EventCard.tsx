"use client";

import { ChevronRight } from "lucide-react";
import { CATEGORY_COLOR_VAR, CATEGORY_LABEL, type SitrepEvent } from "@/lib/types";
import { CATEGORY_ICON } from "@/lib/category-icons";
import { SeverityChip } from "@/components/ui/SeverityChip";
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
  const colorVar = `var(${CATEGORY_COLOR_VAR[event.category]})`;
  const Icon = CATEGORY_ICON[event.category];

  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      title={CATEGORY_LABEL[event.category]}
      className={cn(
        "group relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-transparent bg-surface/40 p-3 pl-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:border-border hover:bg-surface-2 hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.7)]",
        active && "border-border-strong bg-surface-2",
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: colorVar }}
        aria-hidden
      />

      <span
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{
          color: colorVar,
          backgroundColor: `color-mix(in oklch, ${colorVar} 14%, transparent)`,
        }}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-1 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-wide text-ink-faint uppercase">
            {CATEGORY_LABEL[event.category]}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <SeverityChip severity={event.severity} />
          </span>
        </span>

        <span className="block text-sm leading-snug font-medium text-ink">
          {event.title}
        </span>

        <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
          <span className="truncate">{event.country}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{event.source}</span>
          <span aria-hidden>·</span>
          <TimeAgo iso={event.publishedAt} />
        </span>
      </span>

      <ChevronRight
        className="mt-1 size-4 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}
