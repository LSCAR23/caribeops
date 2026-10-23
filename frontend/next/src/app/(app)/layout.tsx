import Navigation from "@/components/Navigation";
import NightBackdrop from "@/components/NightBackdrop";

// Authenticated shell (Caribbean night theme): the shared photographic
// backdrop (general-caribbean-night.webp, fixed + -z-10, one cached
// download across navigations) plus the sticky glass top nav and the
// routed content. /login lives in the (auth) group, outside this
// layout: it renders its OWN vivid mockup photo
// (public/login/caribbean-night.webp) and keeps its full-bleed framing
// with no nav, so the two photos never stack or double-download.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NightBackdrop />
      <Navigation />
      {children}
    </>
  );
}
