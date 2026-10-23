import { cacheLife, cacheTag } from "next/cache";
import { analyticsGet } from "@/lib/analytics-client";
import { ApiError, apiGet } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  CategoryCount,
  MonthlyReviews,
  TopBusiness,
} from "@/types/analytics";
import type {
  ApiCollectionResponse,
  ApiItemResponse,
  ApiListResponse,
} from "@/types/api";
import type { Business } from "@/types/business";
import type { Category } from "@/types/category";
import type { DashboardSummary } from "@/types/dashboard";

// Cached read layer for server components. Every read here is PUBLIC:
// the server never sends a user token (authHeaders() is empty without
// `window`) and all these Laravel/Go GET routes are unauthenticated, so
// one shared cache entry is safe for every visitor.
//
// Lifetime: cacheLife("minutes") — the browser may reuse a result for 5
// minutes, the server refreshes it in the background after 1 minute and
// drops it after an hour without traffic. Tags let the Server Actions in
// app/actions/revalidate.ts expire exactly what a mutation touched.
// Arguments are plain strings/null so they can form the cache key (never
// pass searchParams/params promises in here).

export type DateRange = { from: string | null; to: string | null };

function withQuery(path: string, params: Record<string, string | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, value);
    }
  }
  const text = query.toString();
  return text === "" ? path : `${path}?${text}`;
}

// ---- Laravel ---------------------------------------------------------------

export async function getDashboardSummary(): Promise<ApiItemResponse<DashboardSummary>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("businesses");
  return apiGet<ApiItemResponse<DashboardSummary>>("/api/dashboard/summary");
}

export async function getCategories(): Promise<ApiCollectionResponse<Category>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");
  return apiGet<ApiCollectionResponse<Category>>("/api/categories");
}

export async function getBusinesses(filters: {
  category: string | null;
  search: string | null;
  page: string | null;
}): Promise<ApiListResponse<Business>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("businesses");
  return apiGet<ApiListResponse<Business>>(
    withQuery("/api/businesses", {
      category: filters.category,
      search: filters.search,
      page: filters.page,
    }),
  );
}

// Returns null for an unknown business (404) so the page can call
// notFound() without relying on the ApiError class surviving the cache
// boundary. Other failures still throw and are never cached.
export async function getBusiness(id: string): Promise<Business | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("businesses", `business:${id}`);
  try {
    const result = await apiGet<ApiItemResponse<Business>>(`/api/businesses/${id}`);
    return result.data ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// ---- Go analytics ----------------------------------------------------------

export async function getOverview(range: DateRange): Promise<AnalyticsOverview> {
  "use cache";
  cacheLife("minutes");
  cacheTag("analytics");
  return analyticsGet<AnalyticsOverview>(withQuery("/analytics/overview", range));
}

export async function getBusinessesByCategory(range: DateRange): Promise<CategoryCount[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("analytics");
  return analyticsGet<CategoryCount[]>(
    withQuery("/analytics/businesses-by-category", range),
  );
}

export async function getReviewsByMonth(range: DateRange): Promise<MonthlyReviews[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("analytics");
  return analyticsGet<MonthlyReviews[]>(withQuery("/analytics/reviews-by-month", range));
}

export async function getTopBusinesses(range: DateRange): Promise<TopBusiness[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("analytics");
  return analyticsGet<TopBusiness[]>(withQuery("/analytics/top-businesses", range));
}
