// Aggregates served by GET /api/dashboard/summary (D3-17).
// All counts are whole-table exact; average is null when no reviews exist.
export interface DashboardSummary {
  total_businesses: number;
  total_reviews: number;
  average_rating: number | null;
  new_businesses: number;
}
