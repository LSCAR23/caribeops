import MonthlyChart from "@/components/MonthlyChart";
import SectionFallback from "@/components/SectionFallback";
import { getReviewsByMonth } from "@/lib/data";
import type { MonthlyReviews } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the monthly
// section independently, so a slow Go delays only this section's pixels.
// Reads go through the cached data layer (src/lib/data.ts).
export default async function MonthlySection({
  from,
  to,
}: {
  from?: string | null;
  to?: string | null;
}) {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  let rows: MonthlyReviews[];
  try {
    rows = await getReviewsByMonth({ from: from ?? null, to: to ?? null });
  } catch (error) {
    console.error(error);
    return (
      <>
        <h2 className="text-[22px] font-semibold">
          Reviews by month
        </h2>
        <SectionFallback label="Monthly data" />
      </>
    );
  }

  return (
    <>
      <h2 className="text-[22px] font-semibold">
        Reviews by month
      </h2>
      <MonthlyChart rows={rows} />
    </>
  );
}
