// The quick actions from the brief (§1.7). Shared by the chat UI (buttons)
// and the API route (retrieval hints) — `needsEvent` actions are only
// offered when an event is open, since "explain this" needs a "this".
export type StalinAction =
  | "explain"
  | "background"
  | "compare"
  | "upsc_notes"
  | "mains_answer"
  | "watch_tomorrow";

export const STALIN_ACTIONS: { id: StalinAction; label: string; needsEvent: boolean; prompt: string }[] = [
  {
    id: "explain",
    label: "Explain this event",
    needsEvent: true,
    prompt: "Explain this event: what happened, who the key actors are, and why it matters.",
  },
  {
    id: "background",
    label: "Give me background",
    needsEvent: true,
    prompt:
      "Give me the background behind this: history, key actors, and earlier developments that led here.",
  },
  {
    id: "compare",
    label: "Compare with earlier reports",
    needsEvent: true,
    prompt: "How has this story developed over the last couple of days? What changed between the earlier and the latest reports?",
  },
  {
    id: "upsc_notes",
    label: "Make UPSC notes",
    needsEvent: true,
    prompt:
      "Make concise UPSC notes on this: relevant GS paper(s) and syllabus topics, key facts for Prelims, analytical points for Mains, and related static topics to revise.",
  },
  {
    id: "mains_answer",
    label: "Frame a Mains answer",
    needsEvent: true,
    prompt:
      "Suggest a likely UPSC Mains question on this and frame a ~250-word model answer structure: introduction, multi-dimensional body, way forward, conclusion.",
  },
  {
    id: "watch_tomorrow",
    label: "What should I watch tomorrow",
    needsEvent: false,
    prompt: "Based on the latest situation reports, what should I watch tomorrow? Prioritise India and its neighbourhood.",
  },
];

export const STALIN_ACTION_IDS = STALIN_ACTIONS.map((a) => a.id) as [StalinAction, ...StalinAction[]];
