import CategoryChart from "@/components/CategoryChart";
import SectionFallback from "@/components/SectionFallback";
import { analyticsGet } from "@/lib/analytics-client";
import type { CategoryCount } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the category
// section independently, so a slow Go delays only this section's pixels.
// No connection() call — the page already opts the tree dynamic.
export default async function CategorySection() {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  let rows: CategoryCount[];
  try {
    rows =
      await analyticsGet<CategoryCount[]>("/analytics/businesses-by-category");
  } catch (error) {
    console.error(error);
    return (
      <>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Businesses by category
        </h2>
        <SectionFallback label="Category data" />
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Businesses by category
      </h2>
      <CategoryChart rows={rows} />
    </>
  );
}
