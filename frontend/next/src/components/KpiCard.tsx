// Presentational KPI card (D3-17, restyled for the Caribbean night
// theme). Owns pixels only; the dashboard page owns fetching (same split
// as BusinessList, D3-07). No interactivity. Contract: label and value
// are plain text nodes (KpiCard.test pins them via getByText).
// The glass fill + top cyan hairline give the "live" glow from the
// dashboard mockup; the accent bar under the value is decorative only.
export default function KpiCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`glass-card glass-glow anim-fade-up rounded-2xl p-5 ${className ?? ""}`.trim()}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
      <div
        aria-hidden="true"
        className="mt-3 h-1 w-10 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-[0_0_10px_rgba(53,205,196,0.7)]"
      />
    </div>
  );
}
