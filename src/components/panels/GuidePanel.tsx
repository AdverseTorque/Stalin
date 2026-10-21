import type { ReactNode } from "react";
import { RETENTION_DAYS } from "@/lib/retention";
import { CATEGORY_HEX, CATEGORY_LABEL, type EventCategory } from "@/lib/types";

// "How to use SITREP" — opened from the ? button in the top bar, and shown
// once automatically on a first visit (AppShell).

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-[11px] tracking-widest text-accent uppercase">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const b = (text: string) => <strong className="font-semibold text-ink">{text}</strong>;

export function GuidePanel() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <p className="text-sm leading-relaxed text-ink">
        SITREP collects news from about 30 outlets, the GDELT world-events database and (optionally)
        Telegram channels, every 20 minutes, and keeps the last {RETENTION_DAYS} days. It stores headlines and short
        summaries only — always open the original article before relying on a story.
      </p>

      <Section title="The map">
        <Steps
          items={[
            <>Each dot is news from that place. Its colour is the story type:</>,
            <span key="legend" className="flex flex-wrap gap-x-4 gap-y-1.5">
              {CATEGORIES.map((c) => (
                <span key={c} className="flex items-center gap-1.5 text-xs">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_HEX[c] }} aria-hidden />
                  {CATEGORY_LABEL[c]}
                </span>
              ))}
            </span>,
            <>A {b("number")} means several stories from the same place. A {b("pulsing red ring")} means at least one is critical.</>,
            <>Tap a {b("dot")} to read that story. Tap a {b("number")} to show only that country — tap the blue “Showing … only” label at the bottom to show everything again.</>,
            <>Move around: {b("drag")} to pan; {b("pinch")} (phone) or {b("scroll")} (computer) to zoom; or use the + / − buttons. ↺ resets; {b("India")} jumps to India. On a phone the map opens on India — drag sideways for the rest of the world.</>,
            <>Stories that don’t name a single country (e.g. global markets) appear in the Feed but not on the map.</>,
          ]}
        />
      </Section>

      <Section title="Feed and Timeline">
        <Steps
          items={[
            <>{b("Feed")} lists the newest stories first; type in its search box to find a topic. Tap “Show more” at the bottom for older ones.</>,
            <>Switch between {b("News")} (newspapers, wires, GDELT) and {b("Telegram")} (posts from the Telegram channels) at the top of the Feed. The number beside each is how many items it holds; the Timeline follows the same switch.</>,
            <>{b("Timeline")} (switch at the top of the Feed) groups the last {RETENTION_DAYS} days by day — useful for revision.</>,
          ]}
        />
      </Section>

      <Section title="Filters">
        <Steps
          items={[
            <>On a phone, tap {b("Filters")} in the top bar; on a computer they’re in the left panel.</>,
            <>{b("Category")}: tap to hide or show a story type. {b("Time window")}: last hour to {RETENTION_DAYS} days. {b("Minimum severity")}: e.g. “High+” hides routine stories.</>,
            <>Filters apply to the map, Feed and Timeline together.</>,
          ]}
        />
      </Section>

      <Section title="A story's details">
        <Steps
          items={[
            <>Shows the summary, severity, time, source and a link to the {b("original article")}.</>,
            <>Tap the country name to filter to that country. “Related context” lists similar stories from the last {RETENTION_DAYS} days.</>,
            <>The {b("Ask Stalin")} buttons explain the story, give background, or turn it into UPSC notes / a Mains answer frame.</>,
          ]}
        />
      </Section>

      <Section title="Agents">
        <p>
          AI-written situation reports for 8 regions, refreshed about twice an hour from the stored stories. Each lists
          what happened and why it matters. A {b("NEWS FLASH")} marks a region with something critical.
        </p>
      </Section>

      <Section title="Stalin (the assistant)">
        <Steps
          items={[
            <>Ask anything about current affairs, e.g. “What happened between India and China today?”.</>,
            <>Answers use only the last {RETENTION_DAYS} days of stored stories and cite them as [1], [2]… — tap a source to open it.</>,
            <>It’s an AI: it can be wrong or miss context. Check the cited sources before using an answer in notes or an exam.</>,
          ]}
        />
      </Section>

      <Section title="Install on your phone">
        <Steps
          items={[
            <>{b("Android (Chrome)")}: ⋮ menu → Add to Home screen / Install app.</>,
            <>{b("iPhone (Safari)")}: Share button → Add to Home Screen.</>,
          ]}
        />
      </Section>

      <p className="border-t border-border pt-4 font-mono text-[10px] text-ink-faint">
        Reopen this guide any time with the ? button in the top bar.
      </p>
    </div>
  );
}
