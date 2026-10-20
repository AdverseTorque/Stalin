"use client";

import { Globe2, Rss, Users, GraduationCap, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NAV_TABS, type NavTab } from "@/lib/types";
import { cn } from "@/lib/cn";

const ICONS: Record<NavTab, LucideIcon> = {
  map: Globe2,
  feed: Rss,
  agents: Users,
  upsc: GraduationCap,
  stalin: Bot,
};

export function BottomNav({
  active,
  onChange,
}: {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-canvas/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {NAV_TABS.map(({ id, label }) => {
          const Icon = ICONS[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] tracking-wide uppercase transition-colors",
                isActive ? "text-accent" : "text-ink-faint",
              )}
            >
              <Icon
                className="size-5"
                strokeWidth={isActive ? 2.25 : 1.75}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
