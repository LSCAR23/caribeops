"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

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
      <label
        htmlFor="business-search"
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
      >
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
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="shrink-0 rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          Search
        </button>
      </div>
      {currentSearch !== null && currentSearch !== "" ? (
        <Link
          href={buildUrl("")}
          className="mt-2 inline-block text-sm font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          Clear search
        </Link>
      ) : null}
    </form>
  );
}
