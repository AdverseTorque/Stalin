// Phase 1 placeholder: proves the GitHub -> Vercel deploy pipeline works.
// The real dashboard shell (globe, feeds, ticker, nav) is built in Phase 2.
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-black font-mono text-zinc-100">
      <main className="flex flex-col items-center gap-4 px-6 text-center">
        <p className="text-xs tracking-[0.3em] text-emerald-400">
          SYSTEM ONLINE
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">SITREP</h1>
        <p className="max-w-md text-sm text-zinc-400">
          Global intelligence command center — Phase 1 deployment pipeline
          verified. Dashboard UI arrives in Phase 2.
        </p>
      </main>
    </div>
  );
}
