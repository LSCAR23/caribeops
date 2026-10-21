"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth";

// Logout island (D6-15). Renders only when a token exists — the
// server nav cannot see it. Revocation is best-effort: the local
// cleanup in `finally` guarantees the predictable lifecycle
// (tokenless on /login) even with an already-dead token.
export default function LogoutButton() {
  const [authed, setAuthed] = useState(false);
  const [pending, setPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Intentional post-hydration read (see RequireAuth): the server render
  // must not see the token, and the layout never remounts on client
  // navigation, so re-adopt the token on every route change. The same run
  // also resets transient request state (D7-29): `pending` must not
  // outlive its route, or a logout → login round-trip re-renders this
  // persistent island with a stale, disabled "Logging out…" label.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single run per route, no cascade
    setAuthed(getToken() !== null);
    // No disable needed here: the rule only flags the computed setAuthed
    // above (verified by lint reporting this directive as unused).
    setPending(false);
  }, [pathname]);

  if (!authed) {
    return null;
  }

  async function handleLogout() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      await apiPost("/api/logout", {});
    } finally {
      clearToken();
      router.push("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100/70 hover:text-ink-900 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
    >
      {pending ? "Logging out…" : "Logout"}
    </button>
  );
}
