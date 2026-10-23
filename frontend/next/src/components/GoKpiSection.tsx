import KpiCard from "@/components/KpiCard";
import { formatRating } from "@/components/BusinessList";
import SectionFallback from "@/components/SectionFallback";
import { analyticsGet } from "@/lib/analytics-client";
import type { AnalyticsOverview } from "@/types/analytics";

// Async Server Component island (D5-15): fetches the Go overview and renders
// the three aggregate KPI cards independently, so a slow Go delays only these
// pixels while the shell and the Laravel card resolve on their own timing.
// No connection() call — the page already opts the tree dynamic.
export default async function GoKpiSection({
  from,
  to,
  variant = "compact",
}: {
  from?: string | null;
  to?: string | null;
  /** "feature" = the dashboard's icon cards; "compact" = analytics. */
  variant?: "compact" | "feature";
}) {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  const path = query ? `/analytics/overview?${query}` : "/analytics/overview";

  let overview: AnalyticsOverview;
  try {
    overview = await analyticsGet<AnalyticsOverview>(path);
  } catch (error) {
    console.error(error);
    return <SectionFallback label="Aggregate KPIs" />;
  }
  const average = formatRating(overview.average_rating);

  return (
    <>
      {/* Staggered entrance: optional className keeps the KpiCard props
          contract (label, value) untouched for KpiCard.test. */}
      {/* Feature-card tracks: the rating one is real (average / 5); the
          count cards have no natural maximum, so their track is a fixed
          decorative length taken from the design. */}
      <KpiCard
        label="Total businesses"
        value={String(overview.businesses)}
        variant={variant}
        icon="store"
        progress={35}
      />
      <KpiCard
        label="Total reviews"
        value={String(overview.reviews)}
        className="anim-delay-1"
        variant={variant}
        icon="star"
        progress={33}
      />
      <KpiCard
        label="Average rating"
        value={average !== null ? average : "—"}
        className="anim-delay-2"
        variant={variant}
        icon="star"
        progress={average !== null ? (Number(average) / 5) * 100 : 0}
      />
    </>
  );
}
