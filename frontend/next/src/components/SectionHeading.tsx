// Section heading primitive with the design's type scale: page titles
// are 44px bold with tight tracking; section titles 22px semibold.
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
      className={`${
        Tag === "h1"
          ? "text-[clamp(34px,5vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]"
          : "text-[22px] font-semibold tracking-[-0.01em]"
      } ${className ?? ""}`.trim()}
    >
      {children}
    </Tag>
  );
}
