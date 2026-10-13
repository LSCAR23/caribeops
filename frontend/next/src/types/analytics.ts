// Aggregates served by GET /analytics/overview (D5-11).
// Flat Go shape (no data envelope): exact counts plus the COALESCE-backed
// average, which is never null (0 when no reviews exist).
export interface AnalyticsOverview {
  businesses: number;
  reviews: number;
  average_rating: number;
}

// One row of GET /analytics/businesses-by-category (D5-12).
// Rendered in returned order; the chart scales bars against the max row.
export interface CategoryCount {
  slug: string;
  name: string;
  businesses: number;
}

// One row of GET /analytics/reviews-by-month (D5-13). Month arrives as an
// RFC3339 instant over JSON (Go orders rows oldest-first); the chart formats
// it UTC-anchored so no timezone renames a bucket.
export interface MonthlyReviews {
  month: string;
  reviews: number;
}

// One ranked row of GET /analytics/top-businesses (D5-14). Go orders by
// average rating DESC, review count DESC, id ASC (default limit 10); the UI
// renders this order exactly — never re-sorts.
export interface TopBusiness {
  id: string;
  name: string;
  average_rating: number;
  review_count: number;
}
