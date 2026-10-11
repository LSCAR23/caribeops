import { connection } from "next/server";
import Link from "next/link";
import BusinessList from "@/components/BusinessList";
import CategoryFilter from "@/components/CategoryFilter";
import { apiGet } from "@/lib/api-client";
import type { ApiCollectionResponse, ApiListResponse } from "@/types/api";
import type { Business } from "@/types/business";
import type { Category } from "@/types/category";

// Rendered per request (never prerendered): the list must read live
// Laravel data, and builds must not require Laravel to be up.
// NOTE: `export const dynamic = "force-dynamic"` does not build under
// nextConfig.cacheComponents (Next 16) — `await connection()` + opting out
// of instant navigation below is the version-pinned equivalent
// (see dist/docs caching guides). Streaming/Suspense stays D3-08 scope.
export const instant = false;

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ category_id?: string }>;
}) {
  await connection();
  const { category_id: categoryId } = await searchParams;
  const listPath =
    categoryId !== undefined && categoryId !== ""
      ? `/api/businesses?category_id=${encodeURIComponent(categoryId)}`
      : "/api/businesses";
  const [result, categoriesResult] = await Promise.all([
    apiGet<ApiListResponse<Business>>(listPath),
    apiGet<ApiCollectionResponse<Category>>("/api/categories"),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Businesses
      </h1>
      <div className="mt-4">
        <Link
          href="/businesses/new"
          className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          New business
        </Link>
      </div>
      <CategoryFilter
        categories={categoriesResult.data}
        currentCategoryId={categoryId ?? null}
      />
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Showing {result.data.length} of {result.meta.total} businesses
      </p>
      <BusinessList businesses={result.data} />
    </main>
  );
}
