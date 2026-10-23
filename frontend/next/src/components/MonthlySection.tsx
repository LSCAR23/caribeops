import MonthlyChart from "@/components/MonthlyChart";
import SectionFallback from "@/components/SectionFallback";
import { analyticsGet } from "@/lib/analytics-client";
import type { MonthlyReviews } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the monthly
// section independently, so a slow Go delays only this section's pixels.
// No connection() call — the page already opts the tree dynamic.
export default async function MonthlySection({
  from,
  to,
}: {
  from?: string | null;
  to?: string | null;
}) {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  const path = query
    ? `/analytics/reviews-by-month?${query}`
    : "/analytics/reviews-by-month";

  let rows: MonthlyReviews[];
  try {
    rows = await analyticsGet<MonthlyReviews[]>(path);
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
