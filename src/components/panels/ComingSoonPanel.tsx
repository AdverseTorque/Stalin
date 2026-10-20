import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function ComingSoonPanel({
  icon,
  title,
  description,
  label,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  label: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-mono text-xs tracking-widest text-ink-muted uppercase">
          {label}
        </h2>
      </div>
      <div className="flex-1">
        <EmptyState icon={icon} title={title} description={description} />
      </div>
    </div>
  );
}
