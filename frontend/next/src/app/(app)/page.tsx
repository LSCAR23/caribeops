import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import KpiCard from "@/components/KpiCard";
import GoKpiSection from "@/components/GoKpiSection";
import { KpiGridSkeleton } from "@/components/LoadingSkeleton";
import { buttonClassName } from "@/lib/ui";
import { apiGet } from "@/lib/api-client";
import type { ApiItemResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

// Rendered per request (never prerendered): KPIs must read live data, and
// builds must not require the backends to be up.
export const instant = false;

const inlineLinkClassName =
  "font-medium text-brand-300 transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory rounded";

// Section title with the design's vertical accent bar.
function BarHeading({ id, children }: { id: string; children: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className="h-[30px] w-1 rounded bg-brand-300"
      />
      <h2
        id={id}
        className="text-[30px] font-semibold tracking-[-0.02em] max-[560px]:text-[24px]"
      >
        {children}
      </h2>
    </div>
  );
}

function Bullet() {
  return (
    <span
      aria-hidden="true"
      className="size-[7px] flex-none -translate-y-0.5 rounded-full bg-brand-300"
    />
  );
}

export default async function Home() {
  await connection();
  // The recency card stays on Laravel (D5-11); the Go aggregate cards
  // resolve — and show their skeleton — independently inside the island.
  const result =
    await apiGet<ApiItemResponse<DashboardSummary>>("/api/dashboard/summary");
  const summary = result.data;

  return (
    <main
      id="main-content"
      className="mx-auto box-border flex w-full max-w-[1360px] flex-col gap-14 px-[clamp(20px,5vw,72px)] pt-14 pb-16"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Hero */}
      <section className="anim-fade-up flex max-w-[640px] flex-col gap-[22px] pt-6">
        <p className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-brand-300 shadow-[0_0_12px_var(--color-brand-300)]"
          />
          <span className="text-[13px] font-semibold uppercase tracking-[0.28em] text-brand-200/90">
            Caribe Ops
          </span>
        </p>
        <h1 className="text-[64px] font-bold leading-[1.02] tracking-[-0.035em] max-[820px]:text-[44px]">
          Tourism Operations <span className="text-brand-300">&amp;</span>{" "}
          Analytics
        </h1>
        <p className="text-[17px] leading-relaxed text-ink-600/90">
          Caribe Ops manages Caribbean tourism businesses — hotels,
          restaurants, and tour operators — with live listings, customer
          reviews and ratings, and analytics trends.
        </p>
        <nav aria-label="Get started" className="flex flex-wrap gap-3.5 pt-1.5">
          <Link
            href="/businesses"
            className={buttonClassName("primary", "h-[50px] px-7")}
          >
            View businesses
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/businesses/new"
            className={buttonClassName("secondary", "h-[50px] px-7")}
          >
            Add business
          </Link>
          <Link
            href="/analytics"
            className={buttonClassName("secondary", "h-[50px] px-7")}
          >
            View analytics
          </Link>
        </nav>
      </section>

      <section aria-labelledby="snapshot-heading" className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-2">
          <BarHeading id="snapshot-heading">Live operations snapshot</BarHeading>
          <p className="ml-[18px] text-[15px] text-brand-200/80">
            Totals are live across all businesses; average shows — when no
            reviews exist yet.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
          <Suspense fallback={<KpiGridSkeleton variant="feature" />}>
            <GoKpiSection variant="feature" />
          </Suspense>
          <KpiCard
            label="New (7 days)"
            value={String(summary.new_businesses)}
            className="anim-delay-3"
            variant="feature"
            icon="trend"
            progress={27}
          />
        </div>
      </section>

      <section aria-labelledby="data-heading" className="flex flex-col gap-5">
        <BarHeading id="data-heading">What data is available</BarHeading>
        <ul className="ml-[18px] flex flex-col gap-3.5 text-base text-ink-600/85">
          <li className="flex items-baseline gap-3.5">
            <Bullet />
            <span>
              <strong className="font-semibold text-white">
                Businesses and categories
              </strong>{" "}
              — browse and filter the directory in{" "}
              <Link href="/businesses" className={inlineLinkClassName}>
                Businesses
              </Link>
              .
            </span>
          </li>
          <li className="flex items-baseline gap-3.5">
            <Bullet />
            <span>
              <strong className="font-semibold text-white">
                Reviews and ratings
              </strong>{" "}
              — per-business reviews with average ratings and counts.
            </span>
          </li>
          <li className="flex items-baseline gap-3.5">
            <Bullet />
            <span>
              <strong className="font-semibold text-white">
                Trends and rankings
              </strong>{" "}
              — monthly volume, category breakdown, and top businesses in{" "}
              <Link href="/analytics" className={inlineLinkClassName}>
                Analytics
              </Link>
              .
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}
