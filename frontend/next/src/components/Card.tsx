// Card primitive: the design's glass panel (tinted translucent gradient
// in the page colour, hairline accent border, deep shadow). Used by
// chart panels, detail blocks and form panels.
export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass-card rounded-[18px] p-7 ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
