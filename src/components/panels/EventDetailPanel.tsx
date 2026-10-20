"use client";

import { motion } from "framer-motion";
import { Bot, ExternalLink, MapPin, Tag, X } from "lucide-react";
import type { SitrepEvent } from "@/lib/types";
import { SEVERITY_LABEL } from "@/lib/types";
import { STALIN_ACTIONS, type StalinAction } from "@/lib/stalin/actions";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { findRelatedEvents } from "@/lib/relatedEvents";
import { cn } from "@/lib/cn";

function Content({
  event,
  allEvents,
  onSelectRelated,
  onFilterCountry,
  onAskStalin,
}: {
  event: SitrepEvent;
  allEvents: SitrepEvent[];
  onSelectRelated: (id: string) => void;
  onFilterCountry: (country: string) => void;
  onAskStalin: (action: StalinAction) => void;
}) {
  const related = findRelatedEvents(event, allEvents);

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="space-y-1.5">
          <CategoryBadge category={event.category} />
          <h2 className="text-base leading-snug font-semibold text-ink">
            {event.title}
          </h2>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          {event.summary}
        </p>

        <dl className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <dt className="text-ink-faint uppercase">Severity</dt>
            <dd className="mt-0.5 text-ink">{SEVERITY_LABEL[event.severity]}</dd>
          </div>
          <div>
            <dt className="text-ink-faint uppercase">Reported</dt>
            <dd className="mt-0.5 text-ink">
              <TimeAgo iso={event.publishedAt} />
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <MapPin className="size-3.5 text-ink-faint" aria-hidden />
            <dd className="text-ink">
              <button
                type="button"
                onClick={() => onFilterCountry(event.country)}
                className="underline decoration-dotted underline-offset-2 hover:text-accent"
                title={`Filter the dashboard to ${event.country}`}
              >
                {event.country}
              </button>{" "}
              · {event.continent}
            </dd>
          </div>
        </dl>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="size-3.5 text-ink-faint" aria-hidden />
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          {event.source}
        </a>

        <div>
          <p className="mb-2 font-mono text-[10px] tracking-wide text-ink-faint uppercase">
            Related context (last 7 days)
          </p>
          {related.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 font-mono text-[10px] text-ink-faint">
              No related items found in the current 7-day window yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {related.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRelated(r.id)}
                  className="block w-full rounded-lg border border-border p-2 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <span className="flex items-center justify-between gap-2">
                    <CategoryBadge category={r.category} className="shrink-0" />
                    <span className="truncate font-mono text-[10px] text-ink-faint">
                      {r.country}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-ink">
                    {r.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-ink-faint uppercase">
            <Bot className="size-3.5 text-accent" aria-hidden />
            Ask Stalin
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STALIN_ACTIONS.filter((a) => a.needsEvent).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onAskStalin(a.id)}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-ink-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function EventDetailPanel({
  event,
  allEvents,
  onClose,
  onSelectRelated,
  onFilterCountry,
  onAskStalin,
  variant,
}: {
  event: SitrepEvent;
  allEvents: SitrepEvent[];
  onClose: () => void;
  onSelectRelated: (id: string) => void;
  onFilterCountry: (country: string) => void;
  onAskStalin: (action: StalinAction) => void;
  variant: "panel" | "sheet";
}) {
  if (variant === "sheet") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
          aria-hidden
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 320 }}
          className="relative flex max-h-[75vh] flex-col rounded-t-2xl border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.6)]"
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
          <Content
            event={event}
            allEvents={allEvents}
            onSelectRelated={onSelectRelated}
            onFilterCountry={onFilterCountry}
            onAskStalin={onAskStalin}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className={cn("flex h-full flex-col")}
    >
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] text-ink-faint uppercase hover:bg-surface-2 hover:text-ink"
        >
          ← Back to feed
        </button>
      </div>
      <Content
        event={event}
        allEvents={allEvents}
        onSelectRelated={onSelectRelated}
        onFilterCountry={onFilterCountry}
        onAskStalin={onAskStalin}
      />
    </motion.div>
  );
}
