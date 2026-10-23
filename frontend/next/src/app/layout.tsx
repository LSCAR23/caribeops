import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import NightBackdrop from "@/components/NightBackdrop";
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
  title: "Ojo del Caribe | Tourism Operations & Analytics",
  description: "Tourism operations and analytics for Caribbean businesses.",
};

// The photographic backdrop lives at the root so login and every app
// view share ONE cached download — client navigations never re-fetch it
// or flash. It renders behind all content (fixed + -z-10); everything
// else sits above it. colorScheme:dark steers native form controls,
// scrollbars and :root semantics to match.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <NightBackdrop />
        <RequireAuth />
        {children}
      </body>
    </html>
  );
}
