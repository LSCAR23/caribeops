import { Suspense } from "react";
import Link from "next/link";
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
    <main id="main-content" className="mx-auto w-full max-w-5xl px-6 py-12">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-zinc-900 dark:focus:bg-zinc-950 dark:focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-teal-700 dark:text-teal-400">
        CaribeOps
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
        Tourism Operations &amp; Analytics
      </h1>
      <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
        CaribeOps manages Caribbean tourism businesses — hotels, restaurants,
        and tour operators — with live listings, customer reviews and ratings,
        and analytics trends.
      </p>
      <nav aria-label="Get started" className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/businesses"
          className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          View businesses
        </Link>
        <Link
          href="/businesses/new"
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          Add business
        </Link>
        <Link
          href="/analytics"
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          View analytics
        </Link>
      </nav>
      <section aria-labelledby="snapshot-heading" className="mt-10">
        <h2
          id="snapshot-heading"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Live operations snapshot
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Totals are live across all businesses; average shows — when no
          reviews exist yet.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Suspense fallback={<KpiGridSkeleton />}>
            <GoKpiSection />
          </Suspense>
          <KpiCard
            label="New (7 days)"
            value={String(summary.new_businesses)}
          />
        </div>
      </section>
      <section aria-labelledby="data-heading" className="mt-10">
        <h2
          id="data-heading"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          What data is available
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-zinc-600 dark:text-zinc-300">
          <li>
            Businesses and categories — browse and filter the directory in{" "}
            <Link
              href="/businesses"
              className="font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Businesses
            </Link>
            .
          </li>
          <li>
            Reviews and ratings — per-business reviews with average ratings
            and counts.
          </li>
          <li>
            Trends and rankings — monthly volume, category breakdown, and top
            businesses in{" "}
            <Link
              href="/analytics"
              className="font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Analytics
            </Link>
            .
          </li>
        </ul>
      </section>
    </main>
  );
}
