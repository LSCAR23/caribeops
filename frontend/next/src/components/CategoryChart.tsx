import type { CategoryCount } from "@/types/analytics";

// Presentational per-category chart as a custom SVG donut (D5-12,
// redesigned for the Caribbean night theme). Owns pixels only; the
// analytics page owns fetching (same split as KpiCard/BusinessList,
// D3-07). No chart library, no interactivity logic: segments grow in via
// CSS (--donut-len custom properties), expose the same per-row aria-label
// the old bar version had, and thicken on hover/focus. A bright
// cyan→teal ramp so slices read on the dark glass; coral is only the
// small center accent dot.

// Bright turquoise ramp, vivid first, cycled for extra categories —
// tuned to stay legible over the night backdrop.
const SEGMENT_COLORS = [
  "#5fe6dc",
  "#35cdc4",
  "#1fb6b0",
  "#17b3ac",
  "#0e8f8c",
  "#0b7573",
];

const R = 60;
const CIRCUMFERENCE = 2 * Math.PI * R; // ~376.99

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
    <div className="anim-fade-up mt-5 flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
      <svg viewBox="0 0 160 160" className="h-44 w-44 shrink-0">
        {/* Ivory track behind the segments */}
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="var(--color-ivory-200)"
          strokeWidth={26}
        />
        {segments
          .filter((segment) => segment.length > 0)
          .map((segment) => (
            <g
              key={segment.row.slug}
              className="group focus:outline-none"
              tabIndex={0}
              role="img"
              aria-label={`${segment.row.name}: ${segment.row.businesses} businesses`}
            >
              <title>{`${segment.row.name}: ${segment.row.businesses} businesses`}</title>
              <circle
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={segment.color}
                strokeWidth={26}
                strokeLinecap="butt"
                strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                strokeDashoffset={-segment.start}
                transform="rotate(-90 80 80)"
                className="anim-donut transition-[stroke-width] duration-150 group-hover:[stroke-width:30] group-focus-visible:[stroke-width:30]"
                style={
                  {
                    "--donut-len": segment.length,
                    "--donut-c": CIRCUMFERENCE,
                  } as React.CSSProperties
                }
              />
            </g>
          ))}
        {/* Center readout: total in display serif, caption, mandarin dot */}
        <text
          x="80"
          y="74"
          textAnchor="middle"
          className="fill-ink-900 font-display text-[30px] font-semibold"
        >
          {total}
        </text>
        <text
          x="80"
          y="93"
          textAnchor="middle"
          className="fill-ink-400 text-[10px] font-semibold uppercase tracking-[0.18em]"
        >
          businesses
        </text>
        <circle cx="80" cy="103" r="2.5" fill="var(--color-accent-400)" />
      </svg>
      <ul className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.row.slug} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-[4px]"
              style={{ backgroundColor: segment.color }}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">
              {segment.row.name}
            </span>
            <span className="text-sm tabular-nums text-ink-500">
              {segment.row.businesses}
            </span>
            <span className="w-10 text-right text-xs tabular-nums text-ink-400">
              {segment.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
