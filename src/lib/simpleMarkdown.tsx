import type { ReactNode } from "react";

/**
 * Deliberately minimal — handles "## Heading" lines, "- bullet" lists, and
 * plain paragraphs. The agent prompt (lib/agents/prompt.ts) controls the
 * LLM's output format tightly enough that a full markdown library would be
 * overkill, but real output has varied slightly run to run (e.g. wrapping
 * a heading in bold: "**## What happened**") — this tolerates that rather
 * than requiring exact compliance, and falls back to a plain paragraph for
 * anything it doesn't recognize.
 */
export function renderSimpleMarkdown(md: string): ReactNode {
  const blocks = md.split(/\n\s*\n/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = stripWrappingBold(block.trim());

        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={i} className="mt-3 mb-1 text-xs font-semibold tracking-wide text-ink first:mt-0">
              {trimmed.slice(3)}
            </h4>
          );
        }

        const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.startsWith("- ") || l.startsWith("* "));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-0.5 pl-4 text-sm leading-relaxed text-ink-muted">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-ink-muted">
            {lines.join(" ")}
          </p>
        );
      })}
    </>
  );
}

function stripWrappingBold(block: string): string {
  // "**## Heading**" -> "## Heading" (only when the ENTIRE block is one
  // bolded line, not when ** appears mid-sentence for real emphasis)
  const singleLine = !block.includes("\n");
  if (singleLine && block.startsWith("**") && block.endsWith("**")) {
    return block.slice(2, -2).trim();
  }
  return block;
}
