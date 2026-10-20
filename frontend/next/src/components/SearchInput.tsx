"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { buttonClassName, focusRing, inputClassName, labelClassName } from "@/lib/ui";

// Name search for the business list (D7-02). Like CategoryFilter, this
// island only writes search state into the URL; the server page reads
// searchParams and fetches accordingly, so searches are shareable and
// back-button-safe. Uncontrolled input + submit (no debounce): typing never
// navigates, and the parent remounts via key after each navigation.
export default function SearchInput({
  currentSearch,
  currentCategorySlug,
}: {
  currentSearch: string | null;
  currentCategorySlug: string | null;
}) {
  const router = useRouter();

  function buildUrl(search: string): string {
    const params = new URLSearchParams();
    if (currentCategorySlug !== null && currentCategorySlug !== "") {
      params.set("category", currentCategorySlug);
    }
    if (search !== "") {
      params.set("search", search);
    }
    const query = params.toString();
    return query === "" ? "/businesses" : `/businesses?${query}`;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const search = String(data.get("search") ?? "").trim();
    router.push(buildUrl(search));
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
          defaultValue={currentSearch ?? ""}
          placeholder="Search by name"
          className={inputClassName}
        />
        <button type="submit" className={buttonClassName("primary", "shrink-0")}>
          Search
        </button>
      </div>
      {currentSearch !== null && currentSearch !== "" ? (
        <Link
          href={buildUrl("")}
          className={`mt-2 inline-block text-sm font-medium text-brand-700 underline-offset-4 hover:underline ${focusRing}`}
        >
          Clear search
        </Link>
      ) : null}
    </form>
  );
}
