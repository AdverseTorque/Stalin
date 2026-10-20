// Phase 2: the dashboard UI shell — responsive layout, theme, navigation,
// and the 3D globe wired up with mock data. Real ingestion replaces
// src/lib/mock/events.ts in Phase 3 without touching any component here.
import { AppShell } from "@/components/layout/AppShell";

export default function Home() {
  return <AppShell />;
}
