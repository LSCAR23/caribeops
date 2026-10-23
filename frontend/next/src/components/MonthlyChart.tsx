import type { MonthlyReviews } from "@/types/analytics";

// Presentational review-volume time series as an area chart (D5-13),
// drawn to the analytics artboard of the "Login Ojo del Caribe" design. Owns pixels only; the
// analytics page owns fetching (same split as CategoryChart, D5-12).
// Shows the most recent 12 buckets with an explicit caption — a labeled
// window, never a silent truncation. Month labels are UTC-anchored so the
// container and host-local timezones render identical buckets.
// The line draws in via stroke-dashoffset, the area fades, and every
// point has a hover/focus tooltip plus an aria-label (same
// `${label}: ${reviews} reviews` shape the old bars exposed). A visually
// hidden list carries the full data for screen readers.
const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthShort = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

// Plot geometry: the line/area live in a 1000×280 viewBox stretched to
// the panel (preserveAspectRatio="none", non-scaling stroke); labels and
// points are HTML so text never distorts — same build as the design.
const W = 1000;
const H = 280;

const DELAY_CLASSES = [
  "",
  "anim-delay-1",
  "anim-delay-2",
  "anim-delay-3",
  "anim-delay-4",
];

function yearSuffix(date: Date): string {
  return `’${String(date.getUTCFullYear()).slice(-2)}`;
}

export default function MonthlyChart({ rows }: { rows: MonthlyReviews[] }) {
  const shown = rows.slice(-12);
  const max = Math.max(0, ...shown.map((row) => row.reviews)) || 1;

  const caption = (
    <p className="text-sm text-ink-600/75">
      Showing last {shown.length} of {rows.length} months.
    </p>
  );

  if (shown.length === 0) {
    return <div className="mt-4">{caption}</div>;
  }

  const n = shown.length;
  const peak = Math.max(...shown.map((row) => row.reviews));
  const points = shown.map((row, index) => {
    const date = new Date(row.month);
    const fx = (index + 0.5) / n;
    const fy = 1 - row.reviews / max;
    const short = monthShort.format(date);
    return {
      row,
      index,
      x: fx * W,
      y: fy * H,
      left: `${(fx * 100).toFixed(3)}%`,
      top: `${(fy * 100).toFixed(3)}%`,
      label: monthLabel.format(date),
      tick:
        index === 0 || date.getUTCMonth() === 0
          ? `${short} ${yearSuffix(date)}`
          : short,
      isPeak: row.reviews === peak && peak > 0,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[n - 1].x.toFixed(1)} ${H} L${points[0].x.toFixed(1)} ${H} Z`;

  return (
    <div className="anim-fade-up mt-[22px] flex flex-col gap-[22px]">
      <div
        role="group"
        aria-label="Monthly review volume"
        className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-3"
      >
        {/* Y axis: max / half / zero */}
        <div
          aria-hidden="true"
          className="flex h-[280px] -translate-y-[9px] flex-col justify-between text-right text-[13px] tabular-nums text-ink-400"
        >
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>

        <div className="relative h-[280px]">
          {/* Grid rules */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex flex-col justify-between"
          >
            <span className="h-px bg-brand-400/14" />
            <span className="h-px bg-brand-400/14" />
            <span className="h-px bg-brand-400/30" />
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient id="monthly-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.38" />
                <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#monthly-area)" className="anim-fade-in" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-brand-400)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1000}
              strokeDasharray={1000}
              className="anim-draw"
              style={{ "--draw-from": 1000, "--draw-to": 0 } as React.CSSProperties}
            />
          </svg>

          {/* Points: focusable, with hover/focus tooltip */}
          {points.map((point) => (
            <span
              key={point.row.month}
              tabIndex={0}
              role="img"
              aria-label={`${point.label}: ${point.row.reviews} reviews`}
              title={`${point.label}: ${point.row.reviews} reviews`}
              className={`group anim-fade-in absolute -mt-[6.5px] -ml-[6.5px] size-[13px] rounded-full focus:outline-none ${DELAY_CLASSES[point.index % DELAY_CLASSES.length]}`}
              style={{ left: point.left, top: point.top }}
            >
              <span
                aria-hidden="true"
                className={`block size-full rounded-full border-2 bg-ivory shadow-[0_0_10px_color-mix(in_oklab,var(--color-brand-400)_50%,transparent)] transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 ${
                  point.isPeak ? "border-accent-400" : "border-brand-400"
                }`}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-brand-400/30 bg-ivory px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {point.label}: {point.row.reviews}
              </span>
            </span>
          ))}
        </div>

        <span />
        <div
          aria-hidden="true"
          className="grid pt-3 text-center text-[13px] text-ink-400"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {points.map((point) => (
            // Phones: one label in three, so "Nov ’25" never truncates.
            <span
              key={`tick-${point.row.month}`}
              className={`whitespace-nowrap ${
                point.index % 3 !== 0 ? "max-[560px]:invisible" : ""
              }`}
            >
              {point.tick}
            </span>
          ))}
        </div>
      </div>
      {caption}
      {/* Full data for assistive tech (chart above is visual) */}
      <ul className="sr-only">
        {points.map((point) => (
          <li key={`sr-${point.row.month}`}>
            {point.label}: {point.row.reviews} reviews
          </li>
        ))}
      </ul>
    </div>
  );
}
