// Shared loading skeletons for analytics surfaces (D5-15). Pixels only —
// rendered as Suspense fallbacks while Go fetches are pending, replaced by
// real content the moment each fetch resolves. `aria-busy` marks the transient
// state for assistive tech. One module, one shape per consumer below.

function Shimmer({ className }: { className?: string }) {
  let prefersReduced = false;
  if (typeof window !== "undefined" && window.matchMedia) {
    prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return (
    <div
      aria-hidden="true"
      className={`rounded bg-zinc-200 dark:bg-zinc-800 ${className ?? ""} animate-pulse ${prefersReduced ? "animate-none" : ""}`}
    />
  );
}

// Three shimmer cards matching the home KPI grid (D5-11 Go cards).
export function KpiGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading analytics overview"
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="rounded border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Shimmer className="h-4 w-2/3" />
          <Shimmer className="mt-2 h-9 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Bar-list shimmer matching the chart sections (D5-12/D5-13).
export function ChartSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading chart"
      className="mt-4 space-y-3"
    >
      {Array.from({ length: rows }, (_, key) => (
        <div key={key}>
          <div className="mb-1 flex items-baseline justify-between">
            <Shimmer className="h-4 w-1/4" />
            <Shimmer className="h-4 w-8" />
          </div>
          <Shimmer className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

// Ranked-row shimmer matching the top-businesses section (D5-14).
export function RankListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading top businesses"
      className="mt-4 space-y-4"
    >
      {Array.from({ length: rows }, (_, key) => (
        <div key={key} className="flex items-baseline gap-4">
          <Shimmer className="h-8 w-8 shrink-0" />
          <div className="flex-1">
            <Shimmer className="h-5 w-1/2" />
            <Shimmer className="mt-1 h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
