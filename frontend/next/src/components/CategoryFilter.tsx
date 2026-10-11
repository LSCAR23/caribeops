"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/types/category";

// Category select for the business list (D3-19). This island only writes
// filter state into the URL; the server page reads searchParams and fetches
// accordingly, so the filter is shareable and back-button-safe.
export default function CategoryFilter({
  categories,
  currentCategoryId,
}: {
  categories: Category[];
  currentCategoryId: string | null;
}) {
  const router = useRouter();

  function handleChange(value: string) {
    if (value === "") {
      router.push("/businesses");
    } else {
      router.push(`/businesses?category_id=${encodeURIComponent(value)}`);
    }
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
        value={currentCategoryId ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        className="mt-1 w-full max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
