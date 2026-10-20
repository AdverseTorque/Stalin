import { SEVERITY_LABEL, SEVERITY_WEIGHT, type Severity } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * A pulsing dot whose glow intensity encodes severity (hue stays neutral —
 * category hue is carried separately by CategoryBadge / the globe markers).
 */
export function SeverityDot({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const weight = SEVERITY_WEIGHT[severity];
  return (
    <span
      className={cn("relative inline-flex size-2", className)}
      title={`Severity: ${SEVERITY_LABEL[severity]}`}
    >
      {severity === "critical" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
      )}
      <span
        className="relative inline-flex size-2 rounded-full bg-ink"
        style={{ opacity: 0.3 + weight * 0.7 }}
      />
    </span>
  );
}
