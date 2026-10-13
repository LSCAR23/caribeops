import { connection } from "next/server";
import KpiCard from "@/components/KpiCard";
import { formatRating } from "@/components/BusinessList";
import { apiGet } from "@/lib/api-client";
import { analyticsGet } from "@/lib/analytics-client";
import type { ApiItemResponse } from "@/types/api";
import type { AnalyticsOverview } from "@/types/analytics";
import type { DashboardSummary } from "@/types/dashboard";

// Rendered per request (never prerendered): KPIs must read live Laravel
// data, and builds must not require Laravel to be up.
export const instant = false;

export default async function Home() {
  await connection();
  // Aggregate KPIs come from the Go analytics service (D5-11); the recency
  // card stays on Laravel, which is the only service that computes it.
  // Fetched in parallel so one slow service does not serialize the other.
  const [overview, result] = await Promise.all([
    analyticsGet<AnalyticsOverview>("/analytics/overview"),
    apiGet<ApiItemResponse<DashboardSummary>>("/api/dashboard/summary"),
  ]);
  const summary = result.data;
  const average = formatRating(overview.average_rating);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-teal-700 dark:text-teal-400">
        CaribeOps
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
        Tourism Operations &amp; Analytics
      </h1>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total businesses"
          value={String(overview.businesses)}
        />
        <KpiCard label="Total reviews" value={String(overview.reviews)} />
        <KpiCard
          label="Average rating"
          value={average !== null ? average : "—"}
        />
        <KpiCard
          label="New (7 days)"
          value={String(summary.new_businesses)}
        />
      </div>
    </main>
  );
}
