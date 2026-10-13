import KpiCard from "@/components/KpiCard";
import { formatRating } from "@/components/BusinessList";
import SectionFallback from "@/components/SectionFallback";
import { analyticsGet } from "@/lib/analytics-client";
import type { AnalyticsOverview } from "@/types/analytics";

// Async Server Component island (D5-15): fetches the Go overview and renders
// the three aggregate KPI cards independently, so a slow Go delays only these
// pixels while the shell and the Laravel card resolve on their own timing.
// No connection() call — the page already opts the tree dynamic.
export default async function GoKpiSection() {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  let overview: AnalyticsOverview;
  try {
    overview = await analyticsGet<AnalyticsOverview>("/analytics/overview");
  } catch (error) {
    console.error(error);
    return <SectionFallback label="Aggregate KPIs" />;
  }
  const average = formatRating(overview.average_rating);

  return (
    <>
      <KpiCard
        label="Total businesses"
        value={String(overview.businesses)}
      />
      <KpiCard label="Total reviews" value={String(overview.reviews)} />
      <KpiCard
        label="Average rating"
        value={average !== null ? average : "—"}
      />
    </>
  );
}
