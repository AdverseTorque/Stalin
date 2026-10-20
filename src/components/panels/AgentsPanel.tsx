"use client";

import { Users } from "lucide-react";
import { AGENT_REGION_LABEL } from "@/lib/agents/regions";
import { useAgentReports } from "@/lib/useAgentReports";
import { renderSimpleMarkdown } from "@/lib/simpleMarkdown";
import { SeverityChip } from "@/components/ui/SeverityChip";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeedCardSkeleton } from "@/components/ui/Skeleton";

export function AgentsPanel() {
  const { reports, loading, error } = useAgentReports();
  const withReports = reports.filter((r) => r.summaryMd);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-mono text-xs tracking-widest text-ink-muted uppercase">
          <Users className="size-3.5" aria-hidden />
          Continent Agents
        </h2>
        <span className="font-mono text-[10px] text-ink-faint">
          {withReports.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {error ? (
          <ErrorState
            title="Couldn't load agent reports"
            description="The dashboard keeps working normally — try again shortly."
          />
        ) : loading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <FeedCardSkeleton key={i} />
            ))}
          </div>
        ) : withReports.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No situation reports yet"
            description="Each of the 8 regional agents runs on a schedule and needs at least one tracked event in the last 24h to generate a report. Check back soon."
          />
        ) : (
          <div className="space-y-2 p-1">
            {withReports.map((r) => (
              <div
                key={r.region}
                className="rounded-lg border border-border bg-surface/40 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-ink">
                    {AGENT_REGION_LABEL[r.region]}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {r.isNewsFlash && (
                      <span className="rounded-full border border-red-400/50 bg-red-400/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide text-red-300 uppercase">
                        News Flash
                      </span>
                    )}
                    {r.severity && <SeverityChip severity={r.severity} />}
                  </div>
                </div>

                {renderSimpleMarkdown(r.summaryMd ?? "")}

                <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-ink-faint">
                  {r.generatedAt && <TimeAgo iso={r.generatedAt} />}
                  <span aria-hidden>·</span>
                  <span>{r.itemCount} item{r.itemCount === 1 ? "" : "s"} analyzed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
