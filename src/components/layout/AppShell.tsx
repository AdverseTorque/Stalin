"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { Bot, GraduationCap, Users } from "lucide-react";
import { CATEGORY_LABEL, type EventCategory, type NavTab } from "@/lib/types";
import { useEvents } from "@/lib/useEvents";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { TopBar } from "@/components/layout/TopBar";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { FilterPanel } from "@/components/layout/FilterPanel";
import { FeedPanel } from "@/components/feed/FeedPanel";
import { GlobeView } from "@/components/globe/GlobeView";
import { EventDetailPanel } from "@/components/panels/EventDetailPanel";
import { ComingSoonPanel } from "@/components/panels/ComingSoonPanel";
import { StalinLauncher } from "@/components/assistant/StalinLauncher";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];

export function AppShell() {
  const isDesktop = useIsDesktop();
  const { events, loading, error, dataSource, refresh } = useEvents();
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    () => new Set(ALL_CATEGORIES),
  );

  const toggleCategory = (category: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const filteredEvents = useMemo(
    () => events.filter((e) => activeCategories.has(e.category)),
    [events, activeCategories],
  );

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const closeDetail = () => setSelectedEventId(null);

  const changeTab = (tab: NavTab) => {
    setActiveTab(tab);
    setSelectedEventId(null);
  };

  const globe = (
    <GlobeView
      events={filteredEvents}
      selectedEventId={selectedEventId}
      onSelectEvent={setSelectedEventId}
      loading={loading}
    />
  );

  const feed = (
    <FeedPanel
      events={filteredEvents}
      selectedEventId={selectedEventId}
      onSelect={setSelectedEventId}
      loading={loading && events.length === 0}
      error={error}
      onRetry={refresh}
    />
  );

  const comingSoon: Record<"agents" | "upsc" | "stalin", ReactNode> = {
    agents: (
      <ComingSoonPanel
        icon={Users}
        label="Continent Agents"
        title="Situation reports arrive in Phase 5"
        description="Eight regional AI agents will cluster today's events and flag high-severity items as NEWS FLASH — South Asia/India gets its own dedicated agent."
      />
    ),
    upsc: (
      <ComingSoonPanel
        icon={GraduationCap}
        label="UPSC Mode"
        title="Syllabus tagging arrives in Phase 7"
        description="Every item will be tagged with GS-1 to GS-4 / Prelims relevance, with a daily auto-generated UPSC Digest and exportable notes."
      />
    ),
    stalin: (
      <ComingSoonPanel
        icon={Bot}
        label="Stalin"
        title="Full assistant arrives in Phase 6"
        description="Use the floating Stalin button on desktop for a preview of the chat shell, or the Stalin tab here on mobile."
      />
    ),
  };

  // Center stage: the globe must only ever be mounted once (a second WebGL
  // context on mobile would be wasted GPU/memory), so which single tree gets
  // rendered here depends on the breakpoint rather than on two parallel
  // layouts both being mounted.
  const centerStage = isDesktop
    ? globe
    : activeTab === "map"
      ? globe
      : activeTab === "feed"
        ? feed
        : comingSoon[activeTab];

  const rightPanelContent =
    activeTab === "agents" || activeTab === "upsc" || activeTab === "stalin"
      ? comingSoon[activeTab]
      : feed;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
        <TopBar events={filteredEvents} dataSource={dataSource} />
        <DesktopNav active={activeTab} onChange={changeTab} />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-64 shrink-0 overflow-hidden border-r border-border md:block">
            <FilterPanel
              activeCategories={activeCategories}
              onToggle={toggleCategory}
            />
          </aside>

          <main className="relative flex-1 overflow-hidden pb-16 md:pb-0">
            {centerStage}
          </main>

          <aside className="hidden w-80 shrink-0 overflow-hidden border-l border-border md:block">
            <AnimatePresence mode="wait">
              {selectedEvent ? (
                <EventDetailPanel
                  key="detail"
                  event={selectedEvent}
                  variant="panel"
                  onClose={closeDetail}
                />
              ) : (
                <div key={activeTab} className="h-full">
                  {rightPanelContent}
                </div>
              )}
            </AnimatePresence>
          </aside>
        </div>

        <BottomNav active={activeTab} onChange={changeTab} />

        <AnimatePresence>
          {selectedEvent && (
            <EventDetailPanel
              key="sheet"
              event={selectedEvent}
              variant="sheet"
              onClose={closeDetail}
            />
          )}
        </AnimatePresence>

        <StalinLauncher />
      </div>
    </MotionConfig>
  );
}
