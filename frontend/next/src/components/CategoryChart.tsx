import type { CategoryCount } from "@/types/analytics";

// Presentational per-category donut (D5-12), drawn to the analytics
// artboard of the "Login Ojo del Caribe" design: 170px ring, 18-unit
// stroke, hairline gaps between slices, total + caption in the middle,
// two-column legend. Owns pixels only; the analytics page owns fetching.
// Slice colours come from the page theme (--chart-1…6 in globals.css).
// Each slice keeps its focusable aria-label and thickens on hover/focus.
const SEGMENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

// Visual gap between slices, in viewBox units.
const GAP = 1.5;

const R = 46;
const CIRCUMFERENCE = 2 * Math.PI * R; // ~289.03

export default function CategoryChart({ rows }: { rows: CategoryCount[] }) {
  const total = rows.reduce((sum, row) => sum + row.businesses, 0);
  const fractions = rows.map((row) =>
    total > 0 ? row.businesses / total : 0,
  );

  const segments = rows.map((row, index) => {
    const fraction = fractions[index];
    const length = fraction * CIRCUMFERENCE;
    return {
      row,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      length,
      // Pure cumulative start: sum of all earlier fractions (rows are
      // few, so the slice is clearer than a mutable accumulator, which
      // the react-hooks/immutability rule rejects).
      start:
        fractions.slice(0, index).reduce((sum, f) => sum + f, 0) *
        CIRCUMFERENCE,
      percent: Math.round(fraction * 100),
    };
  });

  return (
    <div className="anim-fade-up mt-6 flex flex-wrap items-center gap-10">
      <div className="relative size-[170px] flex-none">
        <svg viewBox="0 0 120 120" className="size-[170px]">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="color-mix(in oklab, var(--color-brand-400) 10%, transparent)"
            strokeWidth={18}
          />
          {segments
            .filter((segment) => segment.length > 0)
            .map((segment) => {
              const visible = Math.max(segment.length - GAP, 0.5);
              return (
                <g
                  key={segment.row.slug}
                  className="group focus:outline-none"
                  tabIndex={0}
                  role="img"
                  aria-label={`${segment.row.name}: ${segment.row.businesses} businesses`}
                >
                  <title>{`${segment.row.name}: ${segment.row.businesses} businesses`}</title>
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={18}
                    strokeLinecap="butt"
                    strokeDasharray={`${visible} ${CIRCUMFERENCE - visible}`}
                    strokeDashoffset={-segment.start}
                    transform="rotate(-90 60 60)"
                    className="anim-donut transition-[stroke-width] duration-150 group-hover:[stroke-width:21] group-focus-visible:[stroke-width:21]"
                    style={
                      {
                        "--donut-len": visible,
                        "--donut-c": CIRCUMFERENCE,
                      } as React.CSSProperties
                    }
                  />
                </g>
              );
            })}
        </svg>
        {/* Center readout */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1"
        >
          <span className="text-[32px] font-bold leading-none text-white tabular-nums">
            {total}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            businesses
          </span>
        </div>
      </div>
      <ul className="grid flex-[1_1_360px] grid-cols-2 gap-x-10 gap-y-4 max-[720px]:grid-cols-1">
        {segments.map((segment) => (
          <li key={segment.row.slug} className="flex items-center gap-3 text-[15px]">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-[4px]"
              style={{ backgroundColor: segment.color }}
            />
            <span className="min-w-0 flex-1 truncate font-semibold text-white">
              {segment.row.name}
            </span>
            <span className="tabular-nums text-ink-600">
              {segment.row.businesses}
            </span>
            <span className="w-10 text-right text-[13px] tabular-nums text-ink-500">
              {segment.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
