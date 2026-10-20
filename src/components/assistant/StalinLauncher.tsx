"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot } from "lucide-react";
import type { SitrepEvent } from "@/lib/types";
import type { StalinChatState } from "@/lib/stalin/useStalinChat";
import { Panel } from "@/components/ui/Panel";
import { StalinChat } from "@/components/assistant/StalinChat";

/**
 * Floating assistant launcher — desktop only (per brief §1.7, mobile users
 * reach Stalin via the bottom-nav tab instead so it never blocks content).
 * Open state is controlled by AppShell so "Ask Stalin" buttons elsewhere
 * (e.g. the event detail panel) can open it.
 */
export function StalinLauncher({
  open,
  onOpenChange,
  chat,
  contextEvent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: StalinChatState;
  contextEvent: SitrepEvent | null;
}) {
  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-40 hidden md:block">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-auto absolute right-0 bottom-16 w-[26rem]"
          >
            <Panel className="flex h-[34rem] max-h-[calc(100dvh-8rem)] flex-col overflow-hidden bg-surface">
              <StalinChat chat={chat} contextEvent={contextEvent} onClose={() => onOpenChange(false)} />
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? "Close Stalin assistant" : "Open Stalin assistant"}
        className="pointer-events-auto relative flex size-12 items-center justify-center rounded-full border border-accent/40 bg-surface text-accent shadow-[0_0_24px_-4px_rgba(56,189,248,0.55)] transition-transform hover:scale-105"
      >
        <Bot className="size-5" aria-hidden />
        {chat.streaming && !open && (
          <span className="absolute top-1 right-1 size-2 animate-pulse rounded-full bg-accent" aria-hidden />
        )}
      </button>
    </div>
  );
}
