// Aggregates served by GET /analytics/overview (D5-11).
// Flat Go shape (no data envelope): exact counts plus the COALESCE-backed
// average, which is never null (0 when no reviews exist).
export interface AnalyticsOverview {
  businesses: number;
  reviews: number;
  average_rating: number;
}
