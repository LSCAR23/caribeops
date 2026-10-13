import CategoryChart from "@/components/CategoryChart";
import { analyticsGet } from "@/lib/analytics-client";
import type { CategoryCount } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the category
// section independently, so a slow Go delays only this section's pixels.
// No connection() call — the page already opts the tree dynamic.
export default async function CategorySection() {
  const rows =
    await analyticsGet<CategoryCount[]>("/analytics/businesses-by-category");

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Businesses by category
      </h2>
      <CategoryChart rows={rows} />
    </>
  );
}
