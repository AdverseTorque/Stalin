import { SEVERITY_LABEL, type Severity } from "@/lib/types";
import { cn } from "@/lib/cn";

const SEVERITY_STYLE: Record<Severity, string> = {
  low: "border-border text-ink-faint",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  high: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  critical: "border-red-400/50 bg-red-400/15 text-red-300",
};

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide uppercase",
        SEVERITY_STYLE[severity],
      )}
    >
      {severity === "critical" && (
        <span className="size-1 animate-pulse rounded-full bg-red-400" aria-hidden />
      )}
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
