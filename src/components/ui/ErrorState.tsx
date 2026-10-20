import { TriangleAlert } from "lucide-react";

export function ErrorState({
  title = "Couldn't load this feed",
  description = "One of the data sources may be temporarily unavailable. The rest of the dashboard keeps working normally.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10 text-red-300">
        <TriangleAlert className="size-5" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-xs text-sm text-ink-muted">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
        >
          Retry
        </button>
      )}
    </div>
  );
}
