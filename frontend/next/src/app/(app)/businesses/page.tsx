import Link from "next/link";
import BusinessList from "@/components/BusinessList";
import CategoryFilter from "@/components/CategoryFilter";
import SearchInput from "@/components/SearchInput";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
import { buttonClassName, focusRing } from "@/lib/ui";
import { getBusinesses, getCategories } from "@/lib/data";

// Reads go through the cached data layer (src/lib/data.ts); the filters
// from searchParams become part of each cache key. Builds never need
// Laravel: fetches happen at request time behind the cache.
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
  const {
    category: categorySlug,
    search,
    page: pageParam,
  } = await searchParams;
  const [result, categoriesResult] = await Promise.all([
    getBusinesses({
      category: categorySlug ?? null,
      search: search ?? null,
      page: pageParam ?? null,
    }),
    getCategories(),
  ]);
  const currentPage = result.meta.current_page;
  const lastPage = result.meta.last_page;

  return (
    <PageContainer className="flex max-w-[900px] flex-col gap-8">
      <section className="anim-fade-up flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <SectionHeading as="h1">Businesses</SectionHeading>
          <p className="text-[15px] text-ink-600/75">
            Showing{" "}
            <span className="font-semibold text-brand-300">
              {result.data.length}
            </span>{" "}
            of {result.meta.total} businesses
          </p>
        </div>
        <Link href="/businesses/new" className={buttonClassName("primary", "gap-2")}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New business
        </Link>
      </section>
      <div className="flex flex-wrap items-start gap-5">
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
        className="flex items-center gap-4 text-sm"
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
          <span aria-disabled="true" className="font-medium text-ink-400/60">
            Previous
          </span>
        )}
        <p className="text-ink-600/75">
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
          <span aria-disabled="true" className="font-medium text-ink-400/60">
            Next
          </span>
        )}
      </nav>
    </PageContainer>
  );
}
