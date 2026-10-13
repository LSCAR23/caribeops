import Link from "next/link";
import EmptyState from "./EmptyState";
import { formatRating } from "./BusinessList";
import type { TopBusiness } from "@/types/analytics";

// Presentational ranked-business list (D5-14). Owns pixels only; the
// analytics page owns fetching (same split as BusinessList, D3-07).
// Rank is display-only (index + 1): the ordering is computed by Go's SQL and
// rendered exactly as received — this component never sorts or filters.
export default function TopBusinesses({ rows }: { rows: TopBusiness[] }) {
  if (rows.length === 0) {
    return <EmptyState message="No top businesses found." />;
  }

  return (
    <ol className="mt-4 space-y-4">
      {rows.map((row, index) => {
        const rating = formatRating(row.average_rating);
        return (
          <li
            key={row.id}
            className="flex items-baseline gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800"
          >
            <span className="w-8 shrink-0 text-2xl font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
              {index + 1}
            </span>
            <div>
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                <Link
                  href={`/businesses/${row.id}`}
                  className="hover:underline"
                >
                  {row.name}
                </Link>
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {rating !== null ? rating : "—"} average · {row.review_count}{" "}
                reviews
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
