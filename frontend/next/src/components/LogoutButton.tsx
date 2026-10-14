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
  // navigation, so re-adopt the token on every route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single run per route, no cascade
    setAuthed(getToken() !== null);
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
      className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-300 dark:hover:text-zinc-50"
    >
      {pending ? "Logging out…" : "Logout"}
    </button>
  );
}
