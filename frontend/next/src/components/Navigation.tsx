import Link from "next/link";
import NavLinks from "@/components/NavLinks";

// Server header (UI redesign, Phase 3): brand + layout stay on the
// server; the link list lives in the NavLinks island because the
// active-route indicator needs usePathname. Links are never hidden at
// any breakpoint (wrapping row, no hamburger) so keyboard users and
// the Playwright role selectors always reach them.
export default function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-ivory/85 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-1.5 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          <span className="font-display text-lg font-semibold tracking-tight text-brand-700 transition-colors group-hover:text-brand-800">
            CaribeOps
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent-400 transition-colors group-hover:bg-accent-500"
          />
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
