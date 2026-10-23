"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { focusRing, inputClassName, labelClassName } from "@/lib/ui";

// Search-as-you-type for the business list (D7-30, replaces the submit
// button). The input is controlled: typing updates local state at once,
// and a debounced effect writes the search into the URL (the server
// page reads searchParams and fetches), so searches stay shareable and
// back-button-safe. The first search from an empty state pushes a
// history entry; every refinement replaces it so keystrokes never flood
// the back button. External search changes (Clear link, back/forward,
// category links) arrive via the prop and sync into the state — no
// remount, so focus is never lost mid-word. Enter flushes immediately.
const DEBOUNCE_MS = 300;

function buildUrl(search: string, categorySlug: string | null): string {
  const params = new URLSearchParams();
  if (categorySlug !== null && categorySlug !== "") {
    params.set("category", categorySlug);
  }
  if (search !== "") {
    params.set("search", search);
  }
  const query = params.toString();
  return query === "" ? "/businesses" : `/businesses?${query}`;
}

export default function SearchInput({
  currentSearch,
  currentCategorySlug,
}: {
  currentSearch: string | null;
  currentCategorySlug: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentSearch ?? "");
  // True while the URL means "no search". Flips to false when we
  // navigate and back to true only when the prop arrives empty again
  // (Clear link or back/forward) — that restores push-ability.
  const pristineRef = useRef(currentSearch === null || currentSearch === "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (search: string) => {
      const url = buildUrl(search, currentCategorySlug);
      if (pristineRef.current) {
        router.push(url);
      } else {
        router.replace(url);
      }
      pristineRef.current = false;
    },
    [router, currentCategorySlug],
  );

  // Prop → state sync: the URL can change without this input being
  // typed in (Clear search link, back/forward, category links).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prop→state sync, runs only when the URL search changes outside typing (Clear/back/category)
    setValue(currentSearch ?? "");
    pristineRef.current = currentSearch === null || currentSearch === "";
  }, [currentSearch]);

  // Debounced URL write. The cleanup cancels the pending timer on
  // every keystroke and on unmount, so only pauses trigger navigation.
  useEffect(() => {
    const target = value.trim();
    if (target === (currentSearch ?? "")) {
      return;
    }
    const timer = setTimeout(() => navigate(target), DEBOUNCE_MS);
    timerRef.current = timer;
    return () => {
      clearTimeout(timer);
      timerRef.current = null;
    };
  }, [value, currentSearch, navigate]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    navigate(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="mt-4">
      <label htmlFor="business-search" className={labelClassName}>
        Search businesses
      </label>
      <div className="mt-1 flex w-full max-w-xs gap-2">
        <input
          id="business-search"
          name="search"
          type="search"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search by name"
          className={inputClassName}
        />
      </div>
      {currentSearch !== null && currentSearch !== "" ? (
        <Link
          href={buildUrl("", currentCategorySlug)}
          className={`mt-2 inline-block text-sm font-medium text-brand-300 underline-offset-4 hover:underline ${focusRing}`}
        >
          Clear search
        </Link>
      ) : null}
    </form>
  );
}
