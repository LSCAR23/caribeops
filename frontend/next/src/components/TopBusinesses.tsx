import Link from "next/link";
import EmptyState from "./EmptyState";
import { formatRating } from "./BusinessList";
import type { TopBusiness } from "@/types/analytics";

// Presentational ranked-business list (D5-14, redesigned in the UI pass,
// Phase 5). Owns pixels only; the analytics page owns fetching (same
// split as BusinessList, D3-07). Rank is display-only (index + 1): the
// ordering is computed by Go's SQL and rendered exactly as received —
// this component never sorts or filters. Each row adds a decorative
// rating progress bar (mandarin accent on #1); the data itself stays in
// the visible meta text and link, unchanged.

const DELAY_CLASSES = [
  "anim-delay-1",
  "anim-delay-2",
  "anim-delay-3",
  "anim-delay-4",
  "anim-delay-5",
];

export default function TopBusinesses({ rows }: { rows: TopBusiness[] }) {
  if (rows.length === 0) {
    return <EmptyState message="No top businesses found." />;
  }

  return (
    <ol className="anim-fade-up mt-5 space-y-4">
      {rows.map((row, index) => {
        const rating = formatRating(row.average_rating);
        const ratingWidth =
          rating !== null ? (Number.parseFloat(rating) / 5) * 100 : 0;
        return (
          <li
            key={row.id}
            className="flex items-baseline gap-4 border-b border-ink-100 pb-4 last:border-b-0 last:pb-0"
          >
            <span
              className={`w-8 shrink-0 rounded-full text-center font-display text-xl font-semibold tabular-nums leading-8 ${
                index === 0
                  ? "bg-accent-400 text-[#2a0f04]"
                  : "border border-brand-400/30 bg-brand-400/15 text-brand-200"
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-ink-900">
                <Link
                  href={`/businesses/${row.id}`}
                  className="rounded text-brand-300 transition-colors hover:text-brand-200 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                >
                  {row.name}
                </Link>
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {rating !== null ? rating : "—"} average · {row.review_count}{" "}
                reviews
              </p>
              {/* Decorative rating progress (data duplicated above) */}
              <div
                aria-hidden="true"
                className="mt-2 h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-ivory-200"
              >
                <div
                  className={`anim-bar-grow h-full rounded-full bg-brand-500 ${DELAY_CLASSES[index % DELAY_CLASSES.length]}`}
                  style={{ width: `${ratingWidth}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
