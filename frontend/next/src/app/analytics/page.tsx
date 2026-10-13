import { connection } from "next/server";
import CategoryChart from "@/components/CategoryChart";
import MonthlyChart from "@/components/MonthlyChart";
import TopBusinesses from "@/components/TopBusinesses";
import { analyticsGet } from "@/lib/analytics-client";
import type {
  CategoryCount,
  MonthlyReviews,
  TopBusiness,
} from "@/types/analytics";

// Rendered per request (never prerendered): the charts must read live Go
// data, and builds must not require Go to be up.
export const instant = false;

export default async function AnalyticsPage() {
  await connection();
  const [categories, months, top] = await Promise.all([
    analyticsGet<CategoryCount[]>("/analytics/businesses-by-category"),
    analyticsGet<MonthlyReviews[]>("/analytics/reviews-by-month"),
    analyticsGet<TopBusiness[]>("/analytics/top-businesses"),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Analytics
      </h1>
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Businesses by category
        </h2>
        <CategoryChart rows={categories} />
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Reviews by month
        </h2>
        <MonthlyChart rows={months} />
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Top businesses
        </h2>
        <TopBusinesses rows={top} />
      </section>
    </main>
  );
}
