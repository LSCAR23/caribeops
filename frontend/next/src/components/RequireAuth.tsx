"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getToken } from "@/lib/auth";

// Optimistic route gate (D6-14). The Bearer token lives in
// localStorage (client-only), so the server layout cannot protect;
// this null-rendering island redirects instead. Real security stays
// in the Laravel API (sanctum + policies) — this only improves UX.
export default function RequireAuth() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (getToken() === null && pathname !== "/login") {
      router.replace("/login");
    } else if (getToken() !== null && pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router]);

  return null;
}
