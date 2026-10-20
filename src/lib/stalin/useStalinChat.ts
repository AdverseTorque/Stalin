"use client";

import { useCallback, useRef, useState } from "react";
import type { StalinAction } from "@/lib/stalin/actions";

export interface StalinSourceRef {
  n: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface StalinMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: StalinSourceRef[];
  error?: string;
  pending?: boolean;
}

type StreamEvent =
  | { type: "sources"; sources: StalinSourceRef[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

/**
 * Owns the Stalin conversation. Lives in AppShell (one instance), so every
 * place the chat is shown — desktop floating panel, desktop Stalin tab,
 * mobile Stalin tab — shares the same thread.
 */
export function useStalinChat() {
  const [messages, setMessages] = useState<StalinMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<StalinMessage[]>([]);
  messagesRef.current = messages;

  const patchAssistant = (id: string, patch: (m: StalinMessage) => StalinMessage) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));

  const send = useCallback(
    async (text: string, opts: { contextEventId?: string | null; action?: StalinAction } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || abortRef.current) return;

      const userMsg: StalinMessage = { id: nextId(), role: "user", content: trimmed };
      const assistantMsg: StalinMessage = { id: nextId(), role: "assistant", content: "", pending: true };

      // Only completed exchanges go back to the server as history — a
      // failed turn would otherwise leave two user messages in a row.
      const history: { role: "user" | "assistant"; content: string }[] = [];
      const prior = messagesRef.current;
      for (let i = 0; i + 1 < prior.length; i++) {
        const u = prior[i];
        const a = prior[i + 1];
        if (u.role === "user" && a.role === "assistant" && a.content && !a.error) {
          history.push({ role: "user", content: u.content }, { role: "assistant", content: a.content });
          i++;
        }
      }
      history.push({ role: "user", content: trimmed });

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/stalin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            contextEventId: opts.contextEventId ?? undefined,
            action: opts.action,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as StreamEvent;
            if (event.type === "sources") patchAssistant(assistantMsg.id, (m) => ({ ...m, sources: event.sources }));
            else if (event.type === "delta")
              patchAssistant(assistantMsg.id, (m) => ({ ...m, content: m.content + event.text }));
            else if (event.type === "error") patchAssistant(assistantMsg.id, (m) => ({ ...m, error: event.error }));
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          patchAssistant(assistantMsg.id, (m) => ({ ...m, error: (err as Error).message || "Something went wrong." }));
        }
      } finally {
        patchAssistant(assistantMsg.id, (m) => ({ ...m, pending: false }));
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, streaming, send, stop, clear };
}

export type StalinChatState = ReturnType<typeof useStalinChat>;
