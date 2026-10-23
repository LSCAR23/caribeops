import Link from "next/link";
import NavLinks from "@/components/NavLinks";

// Shell (Caribbean night theme): a sticky glass top bar — brand lockup
// on the left, a floating pill of nav links on the right — matching the
// dashboard mockup. Replaces the old sidebar; PageContainer carries no
// left offset anymore. Links are never hidden and there is no hamburger
// at any width (the D7-28 constraint): the pill wraps below sm.
// Server component: brand/layout stay on the server; the active-route
// island stays in NavLinks.
export default function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ivory/55 backdrop-blur-xl supports-[backdrop-filter]:bg-ivory/45">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-3 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-1.5 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          <span className="font-display text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-brand-200">
            Caribe OPS
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(255,133,82,0.9)] transition-colors group-hover:bg-accent-500"
          />
        </Link>

        {/* Floating glass pill housing the nav links + auth actions */}
        <div className="rounded-full border border-white/12 bg-white/7 p-1 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.8)] backdrop-blur-md supports-[backdrop-filter]:bg-white/6">
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
