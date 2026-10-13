import TopBusinesses from "@/components/TopBusinesses";
import SectionFallback from "@/components/SectionFallback";
import { analyticsGet } from "@/lib/analytics-client";
import type { TopBusiness } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the ranked
// section independently, so a slow Go delays only this section's pixels.
// Order is Go's — this island never sorts. No connection() call — the page
// already opts the tree dynamic.
export default async function TopSection() {
  // D5-16: try wraps the fetch only — a Go outage degrades to the fallback
  // below, while a render bug still throws instead of being masked.
  let rows: TopBusiness[];
  try {
    rows = await analyticsGet<TopBusiness[]>("/analytics/top-businesses");
  } catch (error) {
    console.error(error);
    return (
      <>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Top businesses
        </h2>
        <SectionFallback label="Ranking data" />
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Top businesses
      </h2>
      <TopBusinesses rows={rows} />
    </>
  );
}
