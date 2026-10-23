import type { MonthlyReviews } from "@/types/analytics";

// Presentational review-volume time series as a custom SVG area chart
// (D5-13, redesigned in the UI pass, Phase 5). Owns pixels only; the
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

// Plot geometry (viewBox units; the svg scales responsively via w-full).
const W = 640;
const H = 260;
const PAD_X = 40;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;
const PLOT_W = W - PAD_X * 2;
const PLOT_H = H - PAD_TOP - PAD_BOTTOM;

const DELAY_CLASSES = [
  "",
  "anim-delay-1",
  "anim-delay-2",
  "anim-delay-3",
  "anim-delay-4",
];

export default function MonthlyChart({ rows }: { rows: MonthlyReviews[] }) {
  const shown = rows.slice(-12);
  const max = Math.max(0, ...shown.map((row) => row.reviews)) || 1;

  const caption = (
    <p className="mt-3 text-sm text-ink-500">
      Showing last {shown.length} of {rows.length} months.
    </p>
  );

  if (shown.length === 0) {
    return <div className="mt-4">{caption}</div>;
  }

  const n = shown.length;
  const points = shown.map((row, index) => {
    const x =
      PAD_X + (n === 1 ? PLOT_W / 2 : (index * PLOT_W) / (n - 1));
    const y = PAD_TOP + PLOT_H * (1 - row.reviews / max);
    return { row, index, x, y, label: monthLabel.format(new Date(row.month)) };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const baseline = PAD_TOP + PLOT_H;
  const areaPath = `${linePath} L ${points[n - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  const gridLevels = [0, 0.5, 1];

  return (
    <div className="anim-fade-up mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="group"
        aria-label="Monthly review volume"
      >
        {/* Minimal grid: three horizontal rules + y labels */}
        {gridLevels.map((level) => {
          const y = PAD_TOP + PLOT_H * (1 - level);
          return (
            <g key={level}>
              <line
                x1={PAD_X}
                y1={y}
                x2={W - PAD_X}
                y2={y}
                stroke="var(--color-ink-200)"
                strokeWidth="1"
              />
              <text
                x={PAD_X - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-ink-400 text-[10px] tabular-nums"
              >
                {Math.round(max * level)}
              </text>
            </g>
          );
        })}

        {/* Area fill under the line */}
        <defs>
          <linearGradient id="monthly-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#monthly-area)"
          className="anim-fade-in"
        />

        {/* Trend line, drawn in via normalized stroke-dashoffset */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1000}
          strokeDasharray={1000}
          className="anim-draw"
          style={{ "--draw-from": 1000, "--draw-to": 0 } as React.CSSProperties}
        />

        {/* X axis labels: full month+year on the first bucket, short after */}
        {points.map((point) => (
          <text
            key={`label-${point.row.month}`}
            x={point.x}
            y={H - 12}
            textAnchor={
              point.index === 0
                ? "start"
                : point.index === n - 1
                  ? "end"
                  : "middle"
            }
            className="fill-ink-400 text-[10px] font-medium"
          >
            {point.index === 0 ? point.label : monthShort.format(new Date(point.row.month))}
          </text>
        ))}

        {/* Points with hover/focus tooltips (title + CSS-shown bubble) */}
        {points.map((point) => {
          const tooltipText = `${point.label}: ${point.row.reviews}`;
          const tooltipW = tooltipText.length * 6.2 + 16;
          const tooltipX = Math.min(
            Math.max(point.x - tooltipW / 2, 2),
            W - tooltipW - 2,
          );
          const tooltipY = point.y - 32 < 2 ? point.y + 12 : point.y - 32;
          return (
            <g
              key={point.row.month}
              className={`group anim-fade-in focus:outline-none ${DELAY_CLASSES[point.index % DELAY_CLASSES.length]}`}
              tabIndex={0}
              role="img"
              aria-label={`${point.label}: ${point.row.reviews} reviews`}
            >
              <title>{`${point.label}: ${point.row.reviews} reviews`}</title>
              {/* Generous invisible hit area */}
              <circle cx={point.x} cy={point.y} r="16" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="var(--color-surface)"
                stroke="var(--color-brand-600)"
                strokeWidth="2"
                className="transition-[r] duration-150 group-hover:[r:5] group-focus-visible:[r:5]"
              />
              {/* Tooltip bubble: hidden until hover or keyboard focus */}
              <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipW}
                  height={22}
                  rx="6"
                  fill="#052029"
                />
                <text
                  x={tooltipX + tooltipW / 2}
                  y={tooltipY + 15}
                  textAnchor="middle"
                  className="fill-white text-[11px] font-medium"
                >
                  {tooltipText}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      {caption}
      {/* Full data for assistive tech (charts above are visual) */}
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
