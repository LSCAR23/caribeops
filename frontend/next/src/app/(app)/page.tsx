import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import KpiCard from "@/components/KpiCard";
import GoKpiSection from "@/components/GoKpiSection";
import { KpiGridSkeleton } from "@/components/LoadingSkeleton";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
import { buttonClassName } from "@/lib/ui";
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
    <PageContainer id="main-content">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Hero — display heading over the night backdrop, mandarin eyebrow dot */}
      <section className="anim-fade-up">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-brand-400">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-accent-400"
          />
          Caribe OPS
        </p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">
          Tourism Operations &amp; Analytics
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
          Caribe OPS manages Caribbean tourism businesses — hotels,
          restaurants, and tour operators — with live listings, customer
          reviews and ratings, and analytics trends.
        </p>
        <nav aria-label="Get started" className="mt-6 flex flex-wrap gap-3">
          <Link href="/businesses" className={buttonClassName("primary")}>
            View businesses
          </Link>
          <Link href="/businesses/new" className={buttonClassName("secondary")}>
            Add business
          </Link>
          <Link href="/analytics" className={buttonClassName("secondary")}>
            View analytics
          </Link>
        </nav>
      </section>

      <section aria-labelledby="snapshot-heading" className="mt-12">
        <SectionHeading as="h2" id="snapshot-heading">
          Live operations snapshot
        </SectionHeading>
        <p className="mt-1 text-sm text-ink-500">
          Totals are live across all businesses; average shows — when no
          reviews exist yet.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Suspense fallback={<KpiGridSkeleton />}>
            <GoKpiSection />
          </Suspense>
          <KpiCard
            label="New (7 days)"
            value={String(summary.new_businesses)}
            className="anim-delay-1"
          />
        </div>
      </section>

      <section aria-labelledby="data-heading" className="mt-12">
        <SectionHeading as="h2" id="data-heading">
          What data is available
        </SectionHeading>
        <ul className="mt-4 list-disc space-y-2.5 pl-6 text-sm text-ink-600 marker:text-brand-500">
          <li>
            Businesses and categories — browse and filter the directory in{" "}
            <Link
              href="/businesses"
              className="font-semibold text-brand-300 underline decoration-brand-400 underline-offset-4 transition-colors hover:text-brand-200 hover:decoration-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
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
              className="font-semibold text-brand-300 underline decoration-brand-400 underline-offset-4 transition-colors hover:text-brand-200 hover:decoration-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              Analytics
            </Link>
            .
          </li>
        </ul>
      </section>
    </PageContainer>
  );
}
