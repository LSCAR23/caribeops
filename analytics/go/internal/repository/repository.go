package repository

import (
	"context"
	"time"
)

// CategoryCount is one row of the businesses-by-category breakdown (D4-11).
// Slug is the stable category key; Name is the display label.
type CategoryCount struct {
	Slug       string `json:"slug"`
	Name       string `json:"name"`
	Businesses int64  `json:"businesses"`
}

// MonthlyReviews is one month of review volume (D4-12). Month is the first
// day of the month, derived from reviews.review_date.
type MonthlyReviews struct {
	Month   time.Time `json:"month"`
	Reviews int64     `json:"reviews"`
}

// TopBusiness is one ranked business (D4-13). Ranking defaults to average
// rating first, review volume as tiebreak; D4-13 may refine the metric.
type TopBusiness struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	AverageRating float64 `json:"average_rating"`
	ReviewCount   int64   `json:"review_count"`
}

// Repository is the analytics query surface. Implementations run SQL against
// PostgreSQL (pgx, from D4-06 on); services and handlers depend only on this
// interface, never on SQL or driver details.
type Repository interface {
	// BusinessCount returns the number of businesses within the optional
	// inclusive [from, to] date range on created_at (D4-06, D4-09, D7-05).
	BusinessCount(ctx context.Context, from, to time.Time) (int64, error)
	// ReviewCount returns the number of reviews within the optional
	// inclusive [from, to] date range on review_date (D4-07, D4-09, D7-05).
	ReviewCount(ctx context.Context, from, to time.Time) (int64, error)
	// AverageRating returns the mean review rating within the optional
	// inclusive [from, to] date range on review_date. Empty-table NULL
	// handling is the D4-08 implementation's job (COALESCE), not this
	// contract's (D4-08, D4-09, D7-05).
	AverageRating(ctx context.Context, from, to time.Time) (float64, error)
	// BusinessesByCategory groups businesses per category (D4-11, D4-14).
	// An empty category returns every category; a slug filters to that
	// category, and an unknown slug yields an empty slice (D4-15).
	// from/to are optional inclusive bounds on business created_at (D7-05).
	BusinessesByCategory(ctx context.Context, category string, from, to time.Time) ([]CategoryCount, error)
	// ReviewsByMonth groups review volume by month (D4-12, D4-14). Zero from
	// or to leaves that side unbounded (D4-15); bounds are inclusive.
	ReviewsByMonth(ctx context.Context, from, to time.Time) ([]MonthlyReviews, error)
	// TopBusinesses ranks businesses, returning at most limit rows (D4-13,
	// D4-14). The limit parameter anticipates D4-15's ?limit=. Ranking is
	// computed over the filtered date range only (D7-05).
	TopBusinesses(ctx context.Context, limit int, from, to time.Time) ([]TopBusiness, error)
}
