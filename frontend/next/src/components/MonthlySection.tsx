import MonthlyChart from "@/components/MonthlyChart";
import { analyticsGet } from "@/lib/analytics-client";
import type { MonthlyReviews } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the monthly
// section independently, so a slow Go delays only this section's pixels.
// No connection() call — the page already opts the tree dynamic.
export default async function MonthlySection() {
  const rows =
    await analyticsGet<MonthlyReviews[]>("/analytics/reviews-by-month");

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Reviews by month
      </h2>
      <MonthlyChart rows={rows} />
    </>
  );
}
