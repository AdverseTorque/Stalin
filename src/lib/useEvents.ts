"use client";

import useSWR from "swr";
import type { SitrepEvent } from "@/lib/types";

interface EventsResponse {
  events: SitrepEvent[];
  source: "live" | "mock";
  reason?: string;
}

const fetcher = async (url: string): Promise<EventsResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
};

export function useEvents() {
  const { data, error, isLoading, mutate } = useSWR<EventsResponse>(
    "/api/events",
    fetcher,
    {
      // Picks up new ingestion runs without a manual refresh — cheap since
      // the route itself is a single DB query.
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
    },
  );

  return {
    events: data?.events ?? [],
    dataSource: data?.source ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refresh: () => mutate(),
  };
}
