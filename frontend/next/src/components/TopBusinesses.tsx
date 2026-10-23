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
    <ol className="anim-fade-up mt-3 flex flex-col">
      {rows.map((row, index) => {
        const rating = formatRating(row.average_rating);
        const ratingWidth =
          rating !== null ? (Number.parseFloat(rating) / 5) * 100 : 0;
        return (
          <li
            key={row.id}
            className="group/row flex items-start gap-4 border-b border-brand-400/14 py-4 last:border-b-0"
          >
            <span
              className={`flex size-[34px] flex-none items-center justify-center rounded-full text-base font-bold tabular-nums ${
                index === 0
                  ? "bg-accent-400 text-[#1e1405] shadow-[0_0_14px_color-mix(in_oklab,var(--color-accent-400)_50%,transparent)]"
                  : "border border-brand-400/60 bg-brand-500/14 text-brand-200"
              }`}
            >
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-[17px] font-semibold">
                <Link
                  href={`/businesses/${row.id}`}
                  className="rounded text-brand-300 transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                >
                  {row.name}
                </Link>
              </p>
              <p className="text-sm text-ink-600/75">
                {rating !== null ? rating : "—"} average · {row.review_count}{" "}
                reviews
              </p>
              {/* Decorative rating progress (data duplicated above) */}
              <div
                aria-hidden="true"
                className="mt-1.5 h-1 w-[260px] max-w-full overflow-hidden rounded bg-brand-400/14"
              >
                <div
                  className={`anim-bar-grow h-full rounded bg-gradient-to-r from-brand-700 to-brand-400 ${DELAY_CLASSES[index % DELAY_CLASSES.length]}`}
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
