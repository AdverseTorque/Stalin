"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { Bot, GraduationCap } from "lucide-react";
import {
  CATEGORY_LABEL,
  TIME_WINDOW_MS,
  type EventCategory,
  type NavTab,
  type Severity,
  type TimeWindow,
} from "@/lib/types";
import { useEvents } from "@/lib/useEvents";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { useNow } from "@/lib/useNow";
import { TopBar } from "@/components/layout/TopBar";
import { DesktopNav } from "@/components/layout/DesktopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { FilterPanel } from "@/components/layout/FilterPanel";
import { FeedPanel } from "@/components/feed/FeedPanel";
import { GlobeView } from "@/components/globe/GlobeView";
import { EventDetailPanel } from "@/components/panels/EventDetailPanel";
import { AgentsPanel } from "@/components/panels/AgentsPanel";
import { ComingSoonPanel } from "@/components/panels/ComingSoonPanel";
import { StalinLauncher } from "@/components/assistant/StalinLauncher";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];
const SEVERITY_ORDER_LIST: Severity[] = ["low", "medium", "high", "critical"];

export function AppShell() {
  const isDesktop = useIsDesktop();
  const now = useNow();
  const { events, loading, error, dataSource, refresh } = useEvents();
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");
  const [minSeverity, setMinSeverity] = useState<Severity>("low");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const toggleCategory = (category: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const minSeverityRank = SEVERITY_ORDER_LIST.indexOf(minSeverity);

  // Shared by both filtered sets below — category/severity/country are
  // "always on" filters; only the time window differs between the live
  // feed/globe and the Timeline view (which always spans the full 7 days).
  const passesBaseFilters = (e: (typeof events)[number]) =>
    activeCategories.has(e.category) &&
    SEVERITY_ORDER_LIST.indexOf(e.severity) >= minSeverityRank &&
    (countryFilter ? e.country === countryFilter : true);

  const timelineEvents = useMemo(
    () => events.filter(passesBaseFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- passesBaseFilters is a plain closure over the deps below, not itself a dep
    [events, activeCategories, minSeverityRank, countryFilter],
  );

  const filteredEvents = useMemo(() => {
    if (now === null) return []; // matches the server/first-paint render — time-window filtering only applies once mounted
    const cutoff = now - TIME_WINDOW_MS[timeWindow];
    return timelineEvents.filter((e) => new Date(e.publishedAt).getTime() >= cutoff);
  }, [timelineEvents, timeWindow, now]);

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
      countryFilter={countryFilter}
      onSelectCountry={(country) => setCountryFilter((prev) => (prev === country ? null : country))}
      loading={loading}
    />
  );

  const feed = (
    <FeedPanel
      events={filteredEvents}
      timelineEvents={timelineEvents}
      now={now}
      selectedEventId={selectedEventId}
      onSelect={setSelectedEventId}
      loading={loading && events.length === 0}
      error={error}
      onRetry={refresh}
    />
  );

  const agentsPanel = <AgentsPanel />;

  const comingSoon: Record<"upsc" | "stalin", ReactNode> = {
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
        : activeTab === "agents"
          ? agentsPanel
          : comingSoon[activeTab];

  const rightPanelContent =
    activeTab === "agents"
      ? agentsPanel
      : activeTab === "upsc" || activeTab === "stalin"
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
              onToggleCategory={toggleCategory}
              timeWindow={timeWindow}
              onChangeTimeWindow={setTimeWindow}
              minSeverity={minSeverity}
              onChangeMinSeverity={setMinSeverity}
              countryFilter={countryFilter}
              onClearCountryFilter={() => setCountryFilter(null)}
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
                  allEvents={events}
                  variant="panel"
                  onClose={closeDetail}
                  onSelectRelated={setSelectedEventId}
                  onFilterCountry={setCountryFilter}
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
              allEvents={events}
              variant="sheet"
              onClose={closeDetail}
              onSelectRelated={setSelectedEventId}
              onFilterCountry={setCountryFilter}
            />
          )}
        </AnimatePresence>

        <StalinLauncher />
      </div>
    </MotionConfig>
  );
}
