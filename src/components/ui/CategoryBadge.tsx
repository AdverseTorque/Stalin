import { CATEGORY_COLOR_VAR, CATEGORY_LABEL, type EventCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

export function CategoryBadge({
  category,
  className,
}: {
  category: EventCategory;
  className?: string;
}) {
  const colorVar = `var(${CATEGORY_COLOR_VAR[category]})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase",
        className,
      )}
      style={{
        color: colorVar,
        borderColor: `color-mix(in oklch, ${colorVar} 45%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${colorVar} 12%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: colorVar }}
        aria-hidden
      />
      {CATEGORY_LABEL[category]}
    </span>
  );
}
