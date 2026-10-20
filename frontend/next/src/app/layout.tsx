import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import RequireAuth from "@/components/RequireAuth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif for headings/brand/KPI values (UI redesign): the free
// next/font equivalent of the Moling reference — variable font, so no
// weight option is needed (font.md: variable fonts default to the wght
// axis). Body/UI stays Geist Sans (serif headings + sans body pairing).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaribeOps | Tourism Operations & Analytics",
  description: "Tourism operations and analytics for Caribbean businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col font-sans">
        <RequireAuth />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
