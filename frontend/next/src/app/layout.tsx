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
  title: "Caribe OPS | Tourism Operations & Analytics",
  description: "Tourism operations and analytics for Caribbean businesses.",
};

// The photographic backdrop lives in the (app) layout (authenticated
// views share ONE cached download — client navigations never re-fetch
// it or flash). /login renders its own mockup photo instead
// (public/login/caribbean-night.webp), so it is deliberately not here.
// RequireAuth guards the authenticated area from the root.
// colorScheme:dark steers native form controls, scrollbars and :root
// semantics to match.
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
