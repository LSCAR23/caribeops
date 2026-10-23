import Navigation from "@/components/Navigation";

// Authenticated shell (Caribbean night theme): the sticky glass top nav
// plus the routed content. The shared photographic backdrop is already
// rendered once at the root layout (behind everything, one cached
// download across navigations), so this shell does not duplicate it.
// /login lives in the (auth) group, outside this layout, so it keeps its
// own full-bleed framing with no nav.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
