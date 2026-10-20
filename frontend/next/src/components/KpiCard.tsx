// Presentational KPI card (D3-17, restyled in the UI redesign, Phase 4).
// Owns pixels only; the dashboard page owns fetching (same split as
// BusinessList, D3-07). No interactivity. Contract: label and value are
// plain text nodes (KpiCard.test pins them via getByText).
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
      className={`anim-fade-up rounded-2xl border border-ink-100 bg-surface p-5 shadow-[0_1px_2px_rgba(30,29,25,0.04),0_8px_24px_-12px_rgba(30,29,25,0.10)] ${className ?? ""}`.trim()}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight text-ink-900">
        {value}
      </p>
      <div aria-hidden="true" className="mt-3 h-1 w-10 rounded-full bg-brand-500" />
    </div>
  );
}
