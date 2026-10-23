import CategoryChart from "@/components/CategoryChart";
import SectionFallback from "@/components/SectionFallback";
import { getBusinessesByCategory } from "@/lib/data";
import type { CategoryCount } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the category
// section independently, so a slow Go delays only this section's pixels.
// Reads go through the cached data layer (src/lib/data.ts).
export default async function CategorySection({
  from,
  to,
}: {
  from?: string | null;
  to?: string | null;
}) {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  let rows: CategoryCount[];
  try {
    rows = await getBusinessesByCategory({ from: from ?? null, to: to ?? null });
  } catch (error) {
    console.error(error);
    return (
      <>
        <h2 className="text-[22px] font-semibold">
          Businesses by category
        </h2>
        <SectionFallback label="Category data" />
      </>
    );
  }

  return (
    <>
      <h2 className="text-[22px] font-semibold">
        Businesses by category
      </h2>
      <CategoryChart rows={rows} />
    </>
  );
}
