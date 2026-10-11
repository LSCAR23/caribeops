import { connection } from "next/server";
import KpiCard from "@/components/KpiCard";
import { formatRating } from "@/components/BusinessList";
import { apiGet } from "@/lib/api-client";
import type { ApiItemResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

// Rendered per request (never prerendered): KPIs must read live Laravel
// data, and builds must not require Laravel to be up.
export const instant = false;

export default async function Home() {
  await connection();
  const result =
    await apiGet<ApiItemResponse<DashboardSummary>>("/api/dashboard/summary");
  const summary = result.data;
  const average = formatRating(summary.average_rating);

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
          value={String(summary.total_businesses)}
        />
        <KpiCard label="Total reviews" value={String(summary.total_reviews)} />
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
