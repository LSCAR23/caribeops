// Shared page container (UI redesign, Phase 2): replaces the
// `mx-auto w-full max-w-5xl px-6 py-12` string duplicated across
// seven files. Renders the page's single <main> landmark; callers
// pass an id when a skip-link target is needed.
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
      className={`mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-14 ${className ?? ""}`.trim()}
    >
      {children}
    </main>
  );
}
