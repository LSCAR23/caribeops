import type { MonthlyReviews } from "@/types/analytics";

// Presentational review-volume time series (D5-13). Owns pixels only; the
// analytics page owns fetching (same split as CategoryChart, D5-12).
// Shows the most recent 12 buckets with an explicit caption — a labeled
// window, never a silent truncation. Month labels are UTC-anchored so the
// container and host-local timezones render identical buckets.
const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function MonthlyChart({ rows }: { rows: MonthlyReviews[] }) {
  const shown = rows.slice(-12);
  const max = Math.max(0, ...shown.map((row) => row.reviews)) || 1;

  return (
    <div className="mt-4">
      <div className="space-y-3">
        {shown.map((row) => {
          const label = monthLabel.format(new Date(row.month));
          return (
            <div key={row.month}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {label}
                </span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {row.reviews}
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"
                role="img"
                aria-label={`${label}: ${row.reviews} reviews`}
              >
                <div
                  className="h-full rounded bg-teal-600 dark:bg-teal-400"
                  style={{ width: `${(row.reviews / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        Showing last {shown.length} of {rows.length} months.
      </p>
    </div>
  );
}
