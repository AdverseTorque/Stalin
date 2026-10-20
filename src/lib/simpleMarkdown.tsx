import type { ReactNode } from "react";

export interface CitationTarget {
  url: string;
  title: string;
}

/**
 * Deliberately minimal markdown — headings (#/##/###), "-"/"*" and "1."
 * lists, paragraphs, inline **bold**, and optional [n] citation links.
 * LLM output (agent reports, Stalin answers) varies slightly run to run
 * (e.g. a heading wrapped in bold: "**## What happened**"), so this
 * tolerates that rather than requiring exact compliance, and falls back to
 * a plain paragraph for anything it doesn't recognise. Never renders raw
 * HTML — all text goes through React, so model output can't inject markup.
 */
export function renderSimpleMarkdown(md: string, citations?: Map<number, CitationTarget>): ReactNode {
  const blocks = md.split(/\n\s*\n/).filter((b) => b.trim());
  const inline = (text: string) => renderInline(text, citations);

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block
          .trim()
          .split("\n")
          .map((l) => stripWrappingBold(l.trim()))
          .filter(Boolean);
        const out: ReactNode[] = [];
        let k = 0;

        // A block may mix a heading line with the list/paragraph under it.
        while (lines.length > 0 && /^#{1,4}\s/.test(lines[0])) {
          const heading = lines.shift()!.replace(/^#{1,4}\s+/, "");
          out.push(
            <h4 key={k++} className="mt-3 mb-1 text-xs font-semibold tracking-wide text-ink first:mt-0">
              {inline(heading)}
            </h4>,
          );
        }
        if (lines.length > 0) {
          const bullet = lines.every((l) => /^[-*]\s/.test(l));
          const numbered = lines.every((l) => /^\d+[.)]\s/.test(l));
          if (bullet || numbered) {
            const List = numbered ? "ol" : "ul";
            out.push(
              <List
                key={k++}
                className={`${numbered ? "list-decimal" : "list-disc"} space-y-0.5 pl-4 text-sm leading-relaxed text-ink-muted`}
              >
                {lines.map((l, j) => (
                  <li key={j}>{inline(l.replace(/^([-*]|\d+[.)])\s+/, ""))}</li>
                ))}
              </List>,
            );
          } else {
            out.push(
              <p key={k++} className="text-sm leading-relaxed text-ink-muted">
                {inline(lines.join(" "))}
              </p>,
            );
          }
        }
        return <div key={i}>{out}</div>;
      })}
    </>
  );
}

function stripWrappingBold(line: string): string {
  // "**## Heading**" -> "## Heading" (only a whole line wrapped in **, not
  // mid-sentence emphasis)
  if (line.startsWith("**") && line.endsWith("**") && line.length > 4 && !line.slice(2, -2).includes("**")) {
    const inner = line.slice(2, -2).trim();
    if (/^#{1,4}\s/.test(inner)) return inner;
  }
  return line;
}

function renderInline(text: string, citations?: Map<number, CitationTarget>): ReactNode[] {
  // Split on **bold** and [n] / [n, m] citation markers.
  const parts = text.split(/(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const cite = part.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/);
    if (cite && citations) {
      const nums = cite[1].split(",").map((n) => Number(n.trim()));
      return (
        <sup key={i} className="mx-0.5 font-mono text-[10px]">
          {nums.map((n, j) => {
            const target = citations.get(n);
            return (
              <span key={n}>
                {j > 0 && ","}
                {target ? (
                  <a
                    href={target.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={target.title}
                    className="text-accent hover:underline"
                  >
                    {n}
                  </a>
                ) : (
                  n
                )}
              </span>
            );
          })}
        </sup>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
