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
	// BusinessCount feeds the overview (D4-06, D4-09).
	BusinessCount(ctx context.Context) (int64, error)
	// ReviewCount feeds the overview (D4-07, D4-09).
	ReviewCount(ctx context.Context) (int64, error)
	// AverageRating feeds the overview (D4-08, D4-09). Empty-table NULL
	// handling is the D4-08 implementation's job (COALESCE), not this contract's.
	AverageRating(ctx context.Context) (float64, error)
	// BusinessesByCategory groups businesses per category (D4-11, D4-14).
	BusinessesByCategory(ctx context.Context) ([]CategoryCount, error)
	// ReviewsByMonth groups review volume by month (D4-12, D4-14).
	// Date-range filters arrive in D4-15.
	ReviewsByMonth(ctx context.Context) ([]MonthlyReviews, error)
	// TopBusinesses ranks businesses, returning at most limit rows (D4-13,
	// D4-14). The limit parameter anticipates D4-15's ?limit=.
	TopBusinesses(ctx context.Context, limit int) ([]TopBusiness, error)
}
