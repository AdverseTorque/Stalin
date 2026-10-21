"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Link2, Send, Square, Trash2, X } from "lucide-react";
import { RETENTION_DAYS } from "@/lib/retention";
import type { SitrepEvent } from "@/lib/types";
import { STALIN_ACTIONS, type StalinAction } from "@/lib/stalin/actions";
import type { StalinChatState, StalinMessage } from "@/lib/stalin/useStalinChat";
import { renderSimpleMarkdown, type CitationTarget } from "@/lib/simpleMarkdown";
import { cn } from "@/lib/cn";

function AssistantBubble({ message }: { message: StalinMessage }) {
  const citations = useMemo(
    () => new Map<number, CitationTarget>((message.sources ?? []).map((s) => [s.n, { url: s.url, title: s.title }])),
    [message.sources],
  );
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="space-y-2">
      {message.content ? (
        <div className="space-y-1">{renderSimpleMarkdown(message.content, citations)}</div>
      ) : message.pending && !message.error ? (
        <p className="flex items-center gap-2 font-mono text-[11px] text-ink-faint">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
          Stalin is analysing the tracked sources…
        </p>
      ) : null}

      {message.error && (
        <p className="rounded-md border border-red-400/30 bg-red-400/10 px-2.5 py-1.5 text-xs text-red-300">
          {message.error}
        </p>
      )}

      {(message.sources?.length ?? 0) > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint uppercase hover:text-ink"
          >
            <Link2 className="size-3" aria-hidden />
            {showSources ? "Hide" : "Show"} {message.sources!.length} source{message.sources!.length === 1 ? "" : "s"}
          </button>
          {showSources && (
            <ol className="mt-1.5 space-y-1">
              {message.sources!.map((s) => (
                <li key={s.n} className="flex gap-1.5 text-[11px] leading-snug">
                  <span className="shrink-0 font-mono text-ink-faint">[{s.n}]</span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-muted hover:text-accent hover:underline"
                  >
                    {s.title} <span className="text-ink-faint">— {s.source}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function StalinChat({
  chat,
  contextEvent,
  onClose,
}: {
  chat: StalinChatState;
  /** The event currently open in the dashboard, if any — Stalin answers with it as context. */
  contextEvent: SitrepEvent | null;
  onClose?: () => void;
}) {
  const { messages, streaming, send, stop, clear } = chat;
  const [input, setInput] = useState("");
  const [detachedId, setDetachedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const context = contextEvent && contextEvent.id !== detachedId ? contextEvent : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const submit = (text: string, action?: StalinAction) => {
    send(text, { contextEventId: context?.id ?? null, action });
    setInput("");
  };

  const actions = STALIN_ACTIONS.filter((a) => !a.needsEvent || context);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-mono text-xs tracking-widest text-ink uppercase">
          <Bot className="size-4 text-accent" aria-hidden />
          Stalin
        </h2>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="rounded-full p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Stalin"
              className="rounded-full p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">
              Sharp, sourced answers from this dashboard&apos;s own {RETENTION_DAYS}-day feed and the regional situation
              reports — every claim cited, and a plain &quot;not in today&apos;s data&quot; when it isn&apos;t.
            </p>
            <p className="text-xs text-ink-faint">
              {context
                ? "Ask about the open event, or pick an action below."
                : "Open an event on the globe or feed to unlock event-specific actions."}
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-lg rounded-br-sm bg-accent/15 px-3 py-2 text-sm text-ink">
                {m.content}
              </p>
            </div>
          ) : (
            <AssistantBubble key={m.id} message={m} />
          ),
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t border-border p-3">
        {context && (
          <div className="flex items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-2 py-1">
            <span className="shrink-0 font-mono text-[9px] tracking-wide text-accent uppercase">Context</span>
            <span className="truncate text-[11px] text-ink-muted">{context.title}</span>
            <button
              type="button"
              onClick={() => setDetachedId(context.id)}
              aria-label="Don't use this event as context"
              className="ml-auto shrink-0 rounded-full p-0.5 text-ink-faint hover:text-ink"
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={streaming}
              onClick={() => submit(a.prompt, a.id)}
              className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] whitespace-nowrap text-ink-muted transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-40"
            >
              {a.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!streaming) submit(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!streaming) submit(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={context ? "Ask about this event…" : "Ask Stalin…"}
            className="max-h-28 min-h-9 flex-1 resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent/50 focus:outline-none"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-muted hover:text-ink"
            >
              <Square className="size-3.5" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                input.trim()
                  ? "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
                  : "border-border text-ink-faint",
              )}
            >
              <Send className="size-3.5" aria-hidden />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
