// Shared loading skeletons for analytics surfaces (D5-15, restyled as
// glass for the "Login Ojo del Caribe" design). Pixels only — rendered as Suspense
// fallbacks while Go fetches are pending, replaced by real content the
// moment each fetch resolves. `aria-busy` marks the transient state for
// assistive tech. Contracts kept: the three aria-labels, and exactly
// three `.animate-pulse` nodes per chart/rank row (LoadingSkeleton.test
// counts them: rows×3).

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-brand-300/10 ${className ?? ""}`.trim()}
    />
  );
}

// Shimmer cards matching the home/analytics KPI grid. Root uses
// `display: contents` so the cards become direct children of the
// surrounding grid (Suspense is DOM-transparent) instead of nesting a
// grid inside a grid cell. One card per Go KPI (3): on the dashboard
// the fourth cell is the always-present Laravel card.
export function KpiGridSkeleton({
  variant = "compact",
}: {
  variant?: "compact" | "feature";
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading analytics overview"
      className="contents"
    >
      {[0, 1, 2].map((key) =>
        variant === "feature" ? (
          <div
            key={key}
            className="glass-card anim-fade-up flex flex-col gap-5 rounded-[18px] px-[26px] py-6"
          >
            <div className="flex items-center gap-[18px]">
              <Shimmer className="size-12 shrink-0 rounded-full" />
              <div className="flex-1">
                <Shimmer className="h-3.5 w-2/3" />
                <Shimmer className="mt-2.5 h-8 w-1/2" />
              </div>
            </div>
          </div>
        ) : (
          <div
            key={key}
            className="glass-card anim-fade-up rounded-2xl p-[22px]"
          >
            <Shimmer className="h-3.5 w-2/3" />
            <Shimmer className="mt-3 h-8 w-1/3" />
          </div>
        ),
      )}
    </div>
  );
}

// Bar-list shimmer matching the chart sections (D5-12/D5-13).
// Exactly 3 pulse nodes per row.
export function ChartSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading chart"
      className="mt-4 space-y-4"
    >
      {Array.from({ length: rows }, (_, key) => (
        <div key={key}>
          <div className="mb-1.5 flex items-baseline justify-between">
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
// Exactly 3 pulse nodes per row (rank badge + title + meta).
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
            <Shimmer className="mt-1.5 h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
