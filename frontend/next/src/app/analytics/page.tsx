import { Suspense } from "react";
import { connection } from "next/server";
import GoKpiSection from "@/components/GoKpiSection";
import CategorySection from "@/components/CategorySection";
import MonthlySection from "@/components/MonthlySection";
import TopSection from "@/components/TopSection";
import {
  ChartSkeleton,
  KpiGridSkeleton,
  RankListSkeleton,
} from "@/components/LoadingSkeleton";

// Rendered per request (never prerendered): the sections must read live Go
// data, and builds must not require Go to be up.
export const instant = false;

// Shell-first (D5-15): the shell streams immediately while each Go-backed
// section resolves — and shows its skeleton — independently. A slow Go
// delays pixels per section, never the whole page.
export default async function AnalyticsPage() {
  await connection();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Analytics
      </h1>
      <section aria-labelledby="kpis-heading" className="mt-8">
        <h2 id="kpis-heading" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Aggregate KPIs
        </h2>
        <Suspense fallback={<KpiGridSkeleton />}>
          <GoKpiSection />
        </Suspense>
      </section>
      <section className="mt-10">
        <Suspense fallback={<ChartSkeleton />}>
          <CategorySection />
        </Suspense>
      </section>
      <section className="mt-10">
        <Suspense fallback={<ChartSkeleton rows={12} />}>
          <MonthlySection />
        </Suspense>
      </section>
      <section className="mt-10">
        <Suspense fallback={<RankListSkeleton />}>
          <TopSection />
        </Suspense>
      </section>
    </main>
  );
}
