"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { GraduationCap } from "lucide-react";
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
import { WorldMap } from "@/components/map/WorldMap";
import { EventDetailPanel } from "@/components/panels/EventDetailPanel";
import { AgentsPanel } from "@/components/panels/AgentsPanel";
import { ComingSoonPanel } from "@/components/panels/ComingSoonPanel";
import { GuidePanel } from "@/components/panels/GuidePanel";
import { Sheet } from "@/components/ui/Sheet";
import { StalinLauncher } from "@/components/assistant/StalinLauncher";
import { StalinChat } from "@/components/assistant/StalinChat";
import { STALIN_ACTIONS, type StalinAction } from "@/lib/stalin/actions";
import { useStalinChat } from "@/lib/stalin/useStalinChat";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];
const SEVERITY_ORDER_LIST: Severity[] = ["low", "medium", "high", "critical"];
const GUIDE_SEEN_KEY = "sitrep:guide-seen";

export function AppShell() {
  const isDesktop = useIsDesktop();
  const now = useNow();
  const { events, loading, error, dataSource, refresh } = useEvents();
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("2d");
  const [minSeverity, setMinSeverity] = useState<Severity>("low");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [stalinOpen, setStalinOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const stalin = useStalinChat();

  // Show the guide once on a first visit. Storage can be unavailable
  // (private mode, blocked site data) — then it simply isn't auto-shown.
  useEffect(() => {
    try {
      if (!localStorage.getItem(GUIDE_SEEN_KEY)) {
        localStorage.setItem(GUIDE_SEEN_KEY, "1");
        setGuideOpen(true); // eslint-disable-line react-hooks/set-state-in-effect -- one-off read of browser-only storage after mount
      }
    } catch {
      // ignore
    }
  }, []);
  const openGuide = useCallback(() => setGuideOpen(true), []);
  const closeGuide = useCallback(() => setGuideOpen(false), []);
  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const toggleCategory = useCallback((category: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);
  const clearCountryFilter = useCallback(() => setCountryFilter(null), []);

  const minSeverityRank = SEVERITY_ORDER_LIST.indexOf(minSeverity);
  const filtersActive =
    activeCategories.size < ALL_CATEGORIES.length ||
    timeWindow !== "2d" ||
    minSeverity !== "low" ||
    countryFilter !== null;

  // Shared by both filtered sets below — category/severity/country are
  // "always on" filters; only the time window differs between the live
  // feed/map and the Timeline view (which always spans the full retention window).
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

  // Stable identity matters: WorldMap is memo'd, so an inline arrow here
  // would defeat that and re-render the map on every AppShell render.
  const toggleCountryFilter = useCallback(
    (country: string) => setCountryFilter((prev) => (prev === country ? null : country)),
    [],
  );

  const changeTab = (tab: NavTab) => {
    setActiveTab(tab);
    setSelectedEventId(null);
  };

  // "Ask Stalin" from the event detail panel: send the action with the open
  // event as context, then bring the chat into view — the floating panel on
  // desktop (detail panel stays visible), the Stalin tab on mobile (the
  // bottom sheet would otherwise cover the answer).
  const askStalin = (action: StalinAction) => {
    const def = STALIN_ACTIONS.find((a) => a.id === action);
    if (!def) return;
    stalin.send(def.prompt, { contextEventId: selectedEventId, action });
    if (isDesktop) setStalinOpen(true);
    else changeTab("stalin");
  };

  const map = (
    <WorldMap
      events={filteredEvents}
      selectedEventId={selectedEventId}
      onSelectEvent={setSelectedEventId}
      countryFilter={countryFilter}
      onSelectCountry={toggleCountryFilter}
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

  // Left sidebar on desktop; a sheet (with its own title bar) on phones.
  const filterPanel = (showHeader: boolean) => (
    <FilterPanel
      showHeader={showHeader}
      activeCategories={activeCategories}
      onToggleCategory={toggleCategory}
      timeWindow={timeWindow}
      onChangeTimeWindow={setTimeWindow}
      minSeverity={minSeverity}
      onChangeMinSeverity={setMinSeverity}
      countryFilter={countryFilter}
      onClearCountryFilter={clearCountryFilter}
    />
  );

  const agentsPanel = <AgentsPanel />;

  const stalinPanel = <StalinChat chat={stalin} contextEvent={selectedEvent} />;

  const upscPanel: ReactNode = (
    <ComingSoonPanel
      icon={GraduationCap}
      label="UPSC Mode"
      title="Syllabus tagging arrives in Phase 7"
      description="Every item will be tagged with GS-1 to GS-4 / Prelims relevance, with a daily auto-generated UPSC Digest and exportable notes."
    />
  );

  // Center stage: desktop always shows the map; mobile shows whichever tab
  // is active (one tree mounted, not two parallel layouts).
  const centerStage = isDesktop
    ? map
    : activeTab === "map"
      ? map
      : activeTab === "feed"
        ? feed
        : activeTab === "agents"
          ? agentsPanel
          : activeTab === "stalin"
            ? stalinPanel
            : upscPanel;

  const rightPanelContent =
    activeTab === "agents"
      ? agentsPanel
      : activeTab === "stalin"
        ? stalinPanel
        : activeTab === "upsc"
          ? upscPanel
          : feed;

  // On desktop the Stalin tab already shows the chat in the right panel;
  // hide the floating launcher then so the same chat isn't shown twice.
  const stalinTabVisible = activeTab === "stalin" && !selectedEvent;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
        <TopBar
          events={filteredEvents}
          dataSource={dataSource}
          filtersActive={filtersActive}
          onOpenFilters={openFilters}
          onOpenGuide={openGuide}
        />
        <DesktopNav active={activeTab} onChange={changeTab} />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-64 shrink-0 overflow-hidden border-r border-border md:block">
            {filterPanel(true)}
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
                  onAskStalin={askStalin}
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
              onAskStalin={askStalin}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {filtersOpen && !isDesktop && (
            <Sheet key="filters" title="Filters" onClose={closeFilters} className="bg-[#0c1a14]">
              <div className="h-[60dvh]">{filterPanel(false)}</div>
            </Sheet>
          )}
          {guideOpen && (
            <Sheet key="guide" title="How to use SITREP" onClose={closeGuide}>
              <GuidePanel />
            </Sheet>
          )}
        </AnimatePresence>

        {!stalinTabVisible && (
          <StalinLauncher
            open={stalinOpen}
            onOpenChange={setStalinOpen}
            chat={stalin}
            contextEvent={selectedEvent}
          />
        )}
      </div>
    </MotionConfig>
  );
}
