import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import RequireAuth from "@/components/RequireAuth";
import "./globals.css";

// DM Sans is the single family of the night theme — variable font, so
// no weight option is needed (font.md: variable fonts default to the
// wght axis). Display treatment = same family at heavier weight with
// tighter tracking (the --font-display token maps to it).
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Caribe Ops | Tourism Operations & Analytics",
  description: "Tourism operations and analytics for Caribbean businesses.",
};

// Page themes (palette + animal) are applied below this layout: the
// (app) group wraps its routes in ThemeShell and /login sets its own
// lapa theme. RequireAuth guards the authenticated area from the root.
// colorScheme:dark steers native form controls and scrollbars.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <RequireAuth />
        {children}
      </body>
    </html>
  );
}
