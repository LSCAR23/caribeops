import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import { focusRing } from "@/lib/ui";

// Site header in the dashboard style on every page (user request):
// transparent header, brand always "Caribe Ops" + an orange dot, and a
// large glass pill whose active item glows underneath. Colours follow
// the page theme (.site-* rules in globals.css). On phones (≤720px)
// NavLinks swaps the pill for a burger menu.
export default function Navigation() {
  return (
    <header className="site-header">
      <div className="site-header-inner relative flex w-full items-center justify-between gap-4">
        <Link
          href="/"
          className={`group inline-flex items-baseline gap-1.5 rounded-lg py-1 ${focusRing}`}
        >
          <span className="site-brand font-semibold tracking-[-0.02em] text-white transition-colors group-hover:text-brand-200">
            Caribe Ops
          </span>
          <span aria-hidden="true" className="brand-dot size-[7px]" />
        </Link>

        <NavLinks />
      </div>
    </header>
  );
}
