"use client";

import useSWR from "swr";
import type { AgentRegion } from "@/lib/agents/regions";
import type { Severity } from "@/lib/types";

export interface RegionReport {
  region: AgentRegion;
  generatedAt: string | null;
  severity: Severity | null;
  isNewsFlash: boolean;
  itemCount: number;
  summaryMd: string | null;
}

const fetcher = async (url: string): Promise<{ reports: RegionReport[] }> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
};

export function useAgentReports() {
  const { data, error, isLoading } = useSWR("/api/agents", fetcher, {
    refreshInterval: 5 * 60 * 1000,
  });

  return {
    reports: data?.reports ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}
