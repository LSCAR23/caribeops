"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { focusRing } from "@/lib/ui";

// The nav never offers "Login": these pages are only reachable while
// signed in (RequireAuth sends anonymous visitors to /login), so the
// link made no sense. Supersedes D7-29's token-based hiding.
const links = [
  { href: "/", label: "Dashboard" },
  { href: "/businesses", label: "Businesses" },
  { href: "/analytics", label: "Analytics" },
] as const;

// Nav links island. Desktop: the dashboard-style glass pill. Phones
// (≤720px): a burger button toggles the same pill as a dropdown panel.
// The links always stay in the DOM (only hidden by CSS on phones while
// closed), so server rendering and the e2e contract
// getByRole("link", { name: "Businesses" }) are unchanged.
// The menu closes on navigation without an effect: it is "open for one
// pathname", so a route change makes it read as closed. Escape closes
// it and returns focus to the burger.
export default function NavLinks() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const burgerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpenOn(null);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape" && open) {
      close();
      burgerRef.current?.focus();
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <button
        ref={burgerRef}
        type="button"
        aria-expanded={open}
        aria-controls="primary-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenOn(open ? null : pathname)}
        className={`site-pill flex size-[52px] cursor-pointer items-center justify-center rounded-full text-white min-[721px]:hidden ${focusRing}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      <div
        id="primary-menu"
        className={`site-pill rounded-full max-[720px]:absolute max-[720px]:inset-x-[clamp(20px,5vw,72px)] max-[720px]:top-full max-[720px]:mt-3 max-[720px]:rounded-[20px] max-[720px]:p-2 ${
          open ? "" : "max-[720px]:hidden"
        }`}
      >
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center gap-0.5 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-1"
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={close}
                className={`site-link max-[720px]:h-12 ${focusRing}`}
              >
                {link.label}
              </Link>
            );
          })}
          <LogoutButton />
        </nav>
      </div>
    </div>
  );
}
