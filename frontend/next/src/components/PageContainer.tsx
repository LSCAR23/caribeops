// Shared page container. Renders the page's single <main> landmark on
// the same centred 1360px grid and gutters as the site header, so every
// page lines up with the nav. `className` styles the inner column
// (width/alignment differ per page: Analytics sits right of the jaguar,
// Businesses left of the sloth). Callers pass an id for skip links.
export default function PageContainer({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id={id}
      className="mx-auto box-border w-full max-w-[1360px] px-[clamp(20px,5vw,72px)] pt-14 pb-20"
    >
      <div className={className}>{children}</div>
    </main>
  );
}
