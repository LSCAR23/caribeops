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
