// Card primitive (UI redesign, Phase 2): the shared elevated surface
// used by KPI cards, chart panels, detail blocks and form panels.
export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink-100 bg-surface p-6 shadow-[0_1px_2px_rgba(30,29,25,0.04),0_8px_24px_-12px_rgba(30,29,25,0.12)] ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
