import { Suspense } from "react";
import { connection } from "next/server";
import KpiCard from "@/components/KpiCard";
import GoKpiSection from "@/components/GoKpiSection";
import { KpiGridSkeleton } from "@/components/LoadingSkeleton";
import { apiGet } from "@/lib/api-client";
import type { ApiItemResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

// Rendered per request (never prerendered): KPIs must read live data, and
// builds must not require the backends to be up.
export const instant = false;

export default async function Home() {
  await connection();
  // The recency card stays on Laravel, fetched as before (D5-11); its timing
  // is unchanged by D5-15. The Go aggregate cards resolve — and show their
  // skeleton — independently inside the island below.
  const result =
    await apiGet<ApiItemResponse<DashboardSummary>>("/api/dashboard/summary");
  const summary = result.data;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-teal-700 dark:text-teal-400">
        CaribeOps
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
        Tourism Operations &amp; Analytics
      </h1>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Suspense fallback={<KpiGridSkeleton />}>
          <GoKpiSection />
        </Suspense>
        <KpiCard
          label="New (7 days)"
          value={String(summary.new_businesses)}
        />
      </div>
    </main>
  );
}
