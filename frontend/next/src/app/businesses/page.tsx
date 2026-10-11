import { connection } from "next/server";
import BusinessList from "@/components/BusinessList";
import { apiGet } from "@/lib/api-client";
import type { ApiListResponse } from "@/types/api";
import type { Business } from "@/types/business";

// Rendered per request (never prerendered): the list must read live
// Laravel data, and builds must not require Laravel to be up.
// NOTE: `export const dynamic = "force-dynamic"` does not build under
// nextConfig.cacheComponents (Next 16) — `await connection()` + opting out
// of instant navigation below is the version-pinned equivalent
// (see dist/docs caching guides). Streaming/Suspense stays D3-08 scope.
export const instant = false;

export default async function BusinessesPage() {
  await connection();
  const result = await apiGet<ApiListResponse<Business>>("/api/businesses");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Businesses
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Showing {result.data.length} of {result.meta.total} businesses
      </p>
      <BusinessList businesses={result.data} />
    </main>
  );
}
