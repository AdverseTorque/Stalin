import { z } from "zod";
import { streamChat } from "@/lib/llm/client";
import { STALIN_ACTION_IDS } from "@/lib/stalin/actions";
import { buildStalinContext, STALIN_SYSTEM_PROMPT } from "@/lib/stalin/context";

// Streaming can outlast Vercel's short default function timeout.
export const maxDuration = 60;

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000) }))
    .min(1)
    .max(20),
  contextEventId: z.string().regex(/^\d+$/).optional(),
  action: z.enum(STALIN_ACTION_IDS).optional(),
});

// Best-effort abuse guard. The app has no login (single-user by design), so
// anyone with the URL could otherwise burn the Groq free-tier quota that
// the scheduled agents also depend on. In-memory, so it's per serverless
// instance — not a hard guarantee, but it stops casual hammering.
const RATE_LIMIT = 12; // requests
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

// Keep only the tail of the conversation — the token budget is shared
// with the agent runs on Groq's free tier (~8,000 tokens/minute). Odd on
// purpose: turns alternate and end on a user message, so an odd-length
// tail starts on a user turn (Anthropic rejects a leading assistant turn).
const HISTORY_MESSAGES = 5;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many requests — give it a minute." }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { messages, contextEventId, action } = parsed.data;
  const question = messages[messages.length - 1].content;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      try {
        const { contextText, sources } = await buildStalinContext({
          question,
          contextEventId: contextEventId ? Number(contextEventId) : undefined,
          action,
        });
        send({ type: "sources", sources });

        const history = messages.slice(-HISTORY_MESSAGES);
        // Retrieved context is attached to the latest user turn only, so
        // older turns don't re-send stale source lists.
        history[history.length - 1] = {
          role: "user",
          content: `${contextText}\n\n---\nQUESTION: ${question}`,
        };

        for await (const text of streamChat({ system: STALIN_SYSTEM_PROMPT, messages: history, maxTokens: 1400 })) {
          send({ type: "delta", text });
        }
        send({ type: "done" });
      } catch (err) {
        console.error("POST /api/stalin failed:", err);
        const message = err instanceof Error ? err.message : String(err);
        send({
          type: "error",
          error: message.includes("429")
            ? "Stalin is rate-limited right now (free-tier quota shared with the regional agents). Try again in a minute."
            : message.includes("GROQ_API_KEY")
              ? "Stalin isn't configured on this deployment yet (missing GROQ_API_KEY)."
              : "Stalin couldn't answer right now. Try again shortly.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
