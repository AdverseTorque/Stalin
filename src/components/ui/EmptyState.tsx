import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-surface-2 text-accent">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-xs text-sm text-ink-muted">{description}</p>
    </div>
  );
}
