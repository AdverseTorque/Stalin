// Retrieval for the Stalin assistant: turns the user's question (+ the event
// they have open, + the quick action) into a small, numbered set of sources
// from our own 7-day database and the latest regional situation reports.
// Kept deliberately compact — Groq's free tier allows ~8,000 tokens per
// minute, shared with the agent runs, so every prompt has to stay lean.
import { getAgentRegion, AGENT_REGION_LABEL, type AgentRegion } from "@/lib/agents/regions";
import {
  getCountryTimeline,
  getItemById,
  getLatestSituationReport,
  searchByKeywords,
} from "@/lib/data/queries";
import type { ItemRow } from "@/lib/db/schema";
import { detectCountry } from "@/lib/geo/detect";
import type { StalinAction } from "@/lib/stalin/actions";

export interface StalinSource {
  n: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

const MAX_ITEMS = 14;

const STOPWORDS = new Set(
  ("what which when where about there their them they this that these those with from have been were will would " +
    "could should into over under after before between does make give tell explain more most some than then also " +
    "just like your mine upsc notes answer mains frame happening happened latest news today week tomorrow watch " +
    "compare background event events story please").split(" "),
);

function extractKeywords(text: string): string[] {
  // Letters/digits only — also keeps SQL LIKE wildcards (% and _) out of the query.
  const words = text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
  return [...new Set(words.filter((w) => !STOPWORDS.has(w)))].slice(0, 6);
}

function itemLine(n: number, i: ItemRow): string {
  const date = i.publishedAt.toISOString().slice(0, 10);
  const summary = i.summary.length > 180 ? `${i.summary.slice(0, 180)}…` : i.summary;
  return `[${n}] (${date} · ${i.source} · ${i.country} · ${i.category}/${i.severity}) ${i.title} — ${summary}`;
}

export async function buildStalinContext(params: {
  question: string;
  contextEventId?: number;
  action?: StalinAction;
}): Promise<{ contextText: string; sources: StalinSource[]; focusTitle: string | null }> {
  const picked = new Map<number, ItemRow>();
  const add = (rows: ItemRow[], max: number) => {
    for (const r of rows.slice(0, max)) if (picked.size < MAX_ITEMS) picked.set(r.id, r);
  };

  const regions = new Set<AgentRegion>();
  let focusTitle: string | null = null;

  // 1. The event the user has open — always first, so it's source [1].
  if (params.contextEventId) {
    const focus = await getItemById(params.contextEventId);
    if (focus) {
      focusTitle = focus.title;
      add([focus], 1);
      add(await getCountryTimeline(focus.country, 7), params.action === "compare" ? 8 : 4);
      const region = getAgentRegion(focus.country, focus.continent);
      if (region) regions.add(region);
    }
  }

  // 2. A country named in the question.
  const country = detectCountry(params.question);
  if (country) {
    add(await getCountryTimeline(country.name, 7), 5);
    const region = getAgentRegion(country.name, country.continent);
    if (region) regions.add(region);
  }

  // 3. Free-text keyword matches.
  add(await searchByKeywords(extractKeywords(params.question), 8), 8);

  // 4. Situation reports — at most 2 (token budget). "What to watch" leans on
  //    them most; with no region signal at all, default to South Asia (the
  //    user's priority region).
  if (params.action === "watch_tomorrow" || regions.size === 0) regions.add("south_asia");
  const reports = (
    await Promise.all([...regions].slice(0, 2).map(async (r) => ({ r, report: await getLatestSituationReport(r) })))
  ).filter((x) => x.report);

  const items = [...picked.values()];
  const sources: StalinSource[] = items.map((i, idx) => ({
    n: idx + 1,
    title: i.title,
    url: i.url,
    source: i.source,
    publishedAt: i.publishedAt.toISOString(),
  }));

  const parts: string[] = [];
  if (focusTitle) parts.push(`The user currently has this event open: [1] ${focusTitle}`);
  parts.push(
    items.length > 0
      ? `TRACKED SOURCES (last 7 days, from this dashboard's own database):\n${items.map((i, idx) => itemLine(idx + 1, i)).join("\n")}`
      : "TRACKED SOURCES: none matched this question in the last 7 days.",
  );
  for (const { r, report } of reports) {
    const md = report!.summaryMd.length > 1400 ? `${report!.summaryMd.slice(0, 1400)}…` : report!.summaryMd;
    parts.push(
      `LATEST SITUATION REPORT — ${AGENT_REGION_LABEL[r]} (generated ${report!.generatedAt.toISOString().slice(0, 16)} UTC, AI-written from tracked items, not a primary source):\n${md}`,
    );
  }

  return { contextText: parts.join("\n\n"), sources, focusTitle };
}

export const STALIN_SYSTEM_PROMPT = `You are Stalin, the analyst assistant inside SITREP, a geopolitics dashboard used by an Indian UPSC civil-services aspirant. "Stalin" is only this product's name — you are not playing any historical figure and must never adopt one's views or voice.

Style: sharp, analytical, concise. Use short headings or bullets when they help. No filler, no flattery.

Rules:
- Ground answers in the TRACKED SOURCES provided. Cite them inline as [n] right after the claim they support. Never invent a source number or a fact.
- If the tracked sources don't cover the question, say so plainly ("Not in today's tracked data").
- You may add general background knowledge (history, static UPSC topics), but label it clearly as "Background (general knowledge, not from the tracked feed)" and keep it separate from sourced claims. Don't cite numbers for it.
- The data only covers the last 7 days. For "compare with last week"-style questions, compare earlier vs later days within that window and say so.
- Situation reports are AI summaries of tracked items — useful context, but prefer citing the underlying [n] sources.
- On contested issues (borders, conflicts, partisan politics) be balanced and neutral: present the main perspectives fairly and attribute claims to their sources. Where India's official position is relevant (e.g. Jammu & Kashmir is an integral part of India), state it as India's official position.
- For UPSC requests, map content to the syllabus (GS-1/2/3/4, Prelims), and keep facts exam-accurate.`;
