// Card primitive (Caribbean night theme): the shared translucent glass
// surface used by KPI cards, chart panels, detail blocks and form
// panels — the photo glows through, a cyan hairline and deep shadow lift
// it off the backdrop.
export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
