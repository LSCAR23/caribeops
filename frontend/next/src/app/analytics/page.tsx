import { connection } from "next/server";
import CategoryChart from "@/components/CategoryChart";
import { analyticsGet } from "@/lib/analytics-client";
import type { CategoryCount } from "@/types/analytics";

// Rendered per request (never prerendered): the chart must read live Go
// data, and builds must not require Go to be up.
export const instant = false;

export default async function AnalyticsPage() {
  await connection();
  const rows =
    await analyticsGet<CategoryCount[]>("/analytics/businesses-by-category");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Analytics
      </h1>
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Businesses by category
        </h2>
        <CategoryChart rows={rows} />
      </section>
    </main>
  );
}
