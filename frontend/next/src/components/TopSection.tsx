import TopBusinesses from "@/components/TopBusinesses";
import { analyticsGet } from "@/lib/analytics-client";
import type { TopBusiness } from "@/types/analytics";

// Async Server Component island (D5-15): fetches and renders the ranked
// section independently, so a slow Go delays only this section's pixels.
// Order is Go's — this island never sorts. No connection() call — the page
// already opts the tree dynamic.
export default async function TopSection() {
  const rows = await analyticsGet<TopBusiness[]>("/analytics/top-businesses");

  return (
    <>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Top businesses
      </h2>
      <TopBusinesses rows={rows} />
    </>
  );
}
