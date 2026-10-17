import { connection } from "next/server";
import Link from "next/link";
import BusinessList from "@/components/BusinessList";
import CategoryFilter from "@/components/CategoryFilter";
import SearchInput from "@/components/SearchInput";
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

function pageUrl({
  categorySlug,
  search,
  page,
}: {
  categorySlug?: string;
  search?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (categorySlug !== undefined && categorySlug !== "") {
    params.set("category", categorySlug);
  }
  if (search !== undefined && search !== "") {
    params.set("search", search);
  }
  if (page !== undefined && page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query === "" ? "/businesses" : `/businesses?${query}`;
}

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}) {
  await connection();
  const {
    category: categorySlug,
    search,
    page: pageParam,
  } = await searchParams;
  const listParams = new URLSearchParams();
  if (categorySlug !== undefined && categorySlug !== "") {
    listParams.set("category", categorySlug);
  }
  if (search !== undefined && search !== "") {
    listParams.set("search", search);
  }
  if (pageParam !== undefined && pageParam !== "") {
    listParams.set("page", pageParam);
  }
  const listQuery = listParams.toString();
  const listPath =
    listQuery === "" ? "/api/businesses" : `/api/businesses?${listQuery}`;
  const [result, categoriesResult] = await Promise.all([
    apiGet<ApiListResponse<Business>>(listPath),
    apiGet<ApiCollectionResponse<Category>>("/api/categories"),
  ]);
  const currentPage = result.meta.current_page;
  const lastPage = result.meta.last_page;

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
      <SearchInput
        key={search ?? ""}
        currentSearch={search ?? null}
        currentCategorySlug={categorySlug ?? null}
      />
      <CategoryFilter
        categories={categoriesResult.data}
        currentCategorySlug={categorySlug ?? null}
        currentSearch={search ?? null}
      />
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Showing {result.data.length} of {result.meta.total} businesses
      </p>
      <BusinessList businesses={result.data} />
      <nav
        aria-label="Pagination"
        className="mt-6 flex items-center gap-4 text-sm"
      >
        {currentPage > 1 ? (
          <Link
            href={pageUrl({
              categorySlug,
              search,
              page: currentPage - 1,
            })}
            className="font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="font-medium text-zinc-400 dark:text-zinc-600"
          >
            Previous
          </span>
        )}
        <p className="text-zinc-600 dark:text-zinc-300">
          Page {currentPage} of {lastPage}
        </p>
        {currentPage < lastPage ? (
          <Link
            href={pageUrl({
              categorySlug,
              search,
              page: currentPage + 1,
            })}
            className="font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="font-medium text-zinc-400 dark:text-zinc-600"
          >
            Next
          </span>
        )}
      </nav>
    </main>
  );
}
