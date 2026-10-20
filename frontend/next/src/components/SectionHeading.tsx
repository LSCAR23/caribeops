// Section heading primitive (UI redesign, Phase 2): one consistent
// heading scale (display serif comes from the global h1–h3 rule).
export default function SectionHeading({
  as: Tag = "h2",
  id,
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      id={id}
      className={`tracking-tight ${Tag === "h1" ? "text-3xl sm:text-4xl" : "text-xl"} ${className ?? ""}`.trim()}
    >
      {children}
    </Tag>
  );
}
