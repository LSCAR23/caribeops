import type { CategoryCount } from "@/types/analytics";

// Presentational per-category bar chart (D5-12). Owns pixels only; the
// analytics page owns fetching (same split as KpiCard/BusinessList, D3-07).
// Bars scale against the leading row so values stay comparable at any scale.
// No interactivity, no chart library.
export default function CategoryChart({ rows }: { rows: CategoryCount[] }) {
  const max = Math.max(0, ...rows.map((row) => row.businesses)) || 1;

  return (
    <div className="mt-4 space-y-3">
      {rows.map((row) => (
        <div key={row.slug}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">
              {row.name}
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {row.businesses}
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"
            role="img"
            aria-label={`${row.name}: ${row.businesses} businesses`}
          >
            <div
              className="h-full rounded bg-teal-600 dark:bg-teal-400"
              style={{ width: `${(row.businesses / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
