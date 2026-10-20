"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
import { Panel } from "@/components/ui/Panel";

const SUGGESTIONS = [
  "Explain this event",
  "Give me background",
  "Compare with last week",
  "Make UPSC notes",
];

/**
 * Floating assistant launcher — desktop only (per brief §1.7, mobile users
 * reach Stalin via the bottom-nav tab instead so it never blocks content).
 * Phase 2 scope: shell + placeholder only. Real retrieval + streaming
 * responses from Groq arrive in Phase 6.
 */
export function StalinLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-40 hidden md:block">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-auto absolute right-0 bottom-16 w-80"
          >
            <Panel className="flex h-96 flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-accent" aria-hidden />
                  <span className="font-mono text-xs tracking-widest text-ink uppercase">
                    Stalin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close Stalin"
                  className="rounded-full p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <p className="text-sm text-ink-muted">
                  Sharp, analytical, factual — Stalin reads the app&apos;s own
                  7-day data and cites its sources. Streaming answers arrive
                  in Phase 6.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <span
                      key={s}
                      className="cursor-not-allowed rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-ink-faint"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  disabled
                  placeholder="Arriving in Phase 6…"
                  className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-ink-faint placeholder:text-ink-faint focus:outline-none"
                />
                <button
                  disabled
                  aria-label="Send"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-ink-faint"
                >
                  <Send className="size-3.5" aria-hidden />
                </button>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Stalin assistant" : "Open Stalin assistant"}
        className="pointer-events-auto flex size-12 items-center justify-center rounded-full border border-accent/40 bg-surface text-accent shadow-[0_0_24px_-4px_rgba(56,189,248,0.55)] transition-transform hover:scale-105"
      >
        <Bot className="size-5" aria-hidden />
      </button>
    </div>
  );
}
