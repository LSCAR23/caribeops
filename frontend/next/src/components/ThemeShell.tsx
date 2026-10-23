"use client";

import { usePathname } from "next/navigation";
import AnimalBackdrop from "@/components/AnimalBackdrop";
import { themeForPath } from "@/lib/theme";

// Authenticated shell wrapper: picks the page theme from the route and
// sets it as `data-theme`, so the nav, cards, buttons and charts inside
// all switch palette together (globals.css redefines the colour tokens
// per theme). The backdrop is keyed by theme so the animal's entrance
// plays each time the user enters another section. Pixels only.
export default function ThemeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = themeForPath(usePathname());

  return (
    <div data-theme={theme} className="theme-page flex flex-1 flex-col">
      <AnimalBackdrop key={theme} theme={theme} />
      <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
    </div>
  );
}
