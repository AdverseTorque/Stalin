"use client";

import { Rss, Users, GraduationCap, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NavTab } from "@/lib/types";
import { cn } from "@/lib/cn";

const TABS: { id: Exclude<NavTab, "map">; label: string; icon: LucideIcon }[] = [
  { id: "feed", label: "Feed", icon: Rss },
  { id: "agents", label: "Agents", icon: Users },
  { id: "upsc", label: "UPSC", icon: GraduationCap },
  { id: "stalin", label: "Stalin", icon: Bot },
];

export function DesktopNav({
  active,
  onChange,
}: {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}) {
  return (
    <nav className="hidden items-center gap-1 border-b border-border px-2 py-1.5 md:flex">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors",
              isActive
                ? "bg-accent/10 text-accent"
                : "text-ink-faint hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon className="size-3.5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
