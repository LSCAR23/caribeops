import { connection } from "next/server";
import Link from "next/link";
import BusinessList from "@/components/BusinessList";
import CategoryFilter from "@/components/CategoryFilter";
import SearchInput from "@/components/SearchInput";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
import { buttonClassName, focusRing } from "@/lib/ui";
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

const pageLinkClassName = `font-medium text-brand-300 rounded underline-offset-4 hover:underline ${focusRing}`;

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
    <PageContainer>
      <section className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHeading as="h1">Businesses</SectionHeading>
          <p className="mt-2 text-sm text-ink-500">
            Showing {result.data.length} of {result.meta.total} businesses
          </p>
        </div>
        <Link href="/businesses/new" className={buttonClassName("primary")}>
          New business
        </Link>
      </section>
      <div className="mt-6 flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:items-start">
        <SearchInput
          currentSearch={search ?? null}
          currentCategorySlug={categorySlug ?? null}
        />
        <CategoryFilter
          categories={categoriesResult.data}
          currentCategorySlug={categorySlug ?? null}
          currentSearch={search ?? null}
        />
      </div>
      <BusinessList businesses={result.data} />
      <nav
        aria-label="Pagination"
        className="mt-8 flex items-center gap-4 text-sm"
      >
        {currentPage > 1 ? (
          <Link
            href={pageUrl({
              categorySlug,
              search,
              page: currentPage - 1,
            })}
            className={pageLinkClassName}
          >
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className="font-medium text-ink-300">
            Previous
          </span>
        )}
        <p className="text-ink-500">
          Page {currentPage} of {lastPage}
        </p>
        {currentPage < lastPage ? (
          <Link
            href={pageUrl({
              categorySlug,
              search,
              page: currentPage + 1,
            })}
            className={pageLinkClassName}
          >
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className="font-medium text-ink-300">
            Next
          </span>
        )}
      </nav>
    </PageContainer>
  );
}
