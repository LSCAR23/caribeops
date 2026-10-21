"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { getToken } from "@/lib/auth";
import { focusRing } from "@/lib/ui";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/businesses", label: "Businesses" },
  { href: "/analytics", label: "Analytics" },
  { href: "/login", label: "Login" },
] as const;

// Nav links island (UI redesign, Phase 3): active-route state needs
// usePathname, so this part of the header is a client island — it still
// server-renders, so every link exists in the DOM at all widths (the
// e2e contract: getByRole("link", { name: "Businesses" })). Layout,
// labels, order and hrefs are unchanged from the original server nav.
// D7-29: the Login link hides post-hydration while a token exists —
// this supersedes the D6-15 acceptance ("Login link stays visible when
// authed; the gate neutralizes it"), which the user found confusing.
// Same deferred-read pattern as LogoutButton: the server render must
// not see localStorage, so adoption happens in an effect.
export default function NavLinks() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single run per route, no cascade
    setAuthed(getToken() !== null);
  }, [pathname]);

  return (
    <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-1 gap-y-1">
      {links
        // D7-29: drop Login only while authenticated; anonymous keeps
        // the original four-link list the server renders.
        .filter((link) => !(authed && link.href === "/login"))
        .map((link) => {
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
              className={`rounded-lg border-b-2 px-2.5 py-1.5 text-sm transition-colors ${focusRing} ${
                active
                  ? "border-brand-500 font-semibold text-brand-700"
                  : "border-transparent font-medium text-ink-600 hover:bg-ink-100/70 hover:text-ink-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      <LogoutButton />
    </nav>
  );
}
