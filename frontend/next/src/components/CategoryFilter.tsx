"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/types/category";

// Category select for the business list (D3-19, slug switch). This island
// only writes filter state into the URL; the server page reads searchParams
// and fetches accordingly, so the filter is shareable and back-button-safe.
// The current search is preserved so changing category never drops an active
// search, and page resets to 1 via the new searchParams on the server page.
export default function CategoryFilter({
  categories,
  currentCategorySlug,
  currentSearch,
}: {
  categories: Category[];
  currentCategorySlug: string | null;
  currentSearch: string | null;
}) {
  const router = useRouter();

  function handleChange(value: string) {
    const params = new URLSearchParams();
    if (currentSearch !== null && currentSearch !== "") {
      params.set("search", currentSearch);
    }
    if (value !== "") {
      params.set("category", value);
    }
    const query = params.toString();
    router.push(query === "" ? "/businesses" : `/businesses?${query}`);
  }

  return (
    <div className="mt-4">
      <label
        htmlFor="category-filter"
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-50"
      >
        Filter by category
      </label>
      <select
        id="category-filter"
        value={currentCategorySlug ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        className="mt-1 w-full max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
