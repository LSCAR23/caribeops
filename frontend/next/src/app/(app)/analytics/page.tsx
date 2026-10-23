import { Suspense } from "react";
import { connection } from "next/server";
import DateRangeSelector from "@/components/DateRangeSelector";
import GoKpiSection from "@/components/GoKpiSection";
import CategorySection from "@/components/CategorySection";
import MonthlySection from "@/components/MonthlySection";
import TopSection from "@/components/TopSection";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
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
// delays pixels per section, never the whole page. Date range (D7-05) is
// read once from searchParams and threaded to each island as a prop, so
// every section filters server-side over the same window.
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await connection();
  const { from, to } = await searchParams;

  return (
    <PageContainer className="ml-auto flex max-w-[860px] flex-col gap-10">
      <section className="anim-fade-up">
        <SectionHeading as="h1">Analytics</SectionHeading>
        <DateRangeSelector />
      </section>
      <section aria-labelledby="kpis-heading" className="flex flex-col gap-[18px]">
        <SectionHeading as="h2" id="kpis-heading">
          Aggregate KPIs
        </SectionHeading>
        {/* Grid wraps the (DOM-transparent) Suspense, so both the shimmer
            cards and the resolved KPI cards are direct grid items. */}
        <div className="grid grid-cols-3 gap-[18px] max-[1000px]:grid-cols-1">
          <Suspense fallback={<KpiGridSkeleton />}>
            <GoKpiSection from={from ?? null} to={to ?? null} />
          </Suspense>
        </div>
      </section>
      <Card className="glass-hover">
        <Suspense fallback={<ChartSkeleton />}>
          <CategorySection from={from ?? null} to={to ?? null} />
        </Suspense>
      </Card>
      <Card className="glass-hover">
        <Suspense fallback={<ChartSkeleton rows={12} />}>
          <MonthlySection from={from ?? null} to={to ?? null} />
        </Suspense>
      </Card>
      <Card className="glass-hover">
        <Suspense fallback={<RankListSkeleton />}>
          <TopSection from={from ?? null} to={to ?? null} />
        </Suspense>
      </Card>
    </PageContainer>
  );
}
