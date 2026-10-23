import Navigation from "@/components/Navigation";
import ThemeShell from "@/components/ThemeShell";

// Authenticated shell ("Login Ojo del Caribe" design): ThemeShell picks
// the page palette + animal from the route (tortuga / jaguar /
// perezoso) and wraps the nav and the routed content, so everything
// inside shares one theme. /login lives in the (auth) group with its
// own lapa theme and no nav.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeShell>
      <Navigation />
      {children}
    </ThemeShell>
  );
}
