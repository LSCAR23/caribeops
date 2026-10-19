package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Postgres implements Repository against PostgreSQL via pgx. Methods are
// added one per task from D4-06 on; the compile assertion below fails the
// build while the surface is still partial, which is intentional —
// unimplemented methods stay absent rather than stubbed.
type Postgres struct {
	pool *pgxpool.Pool
}

// NewPostgres wraps an established pool (see internal/db.Connect). The pool
// stays owned by the caller, which closes it.
func NewPostgres(pool *pgxpool.Pool) *Postgres {
	return &Postgres{pool: pool}
}

// BusinessCount returns the number of businesses (D4-06). Aggregation stays
// in the database: COUNT(*) ships a single integer instead of every row.
// Optional inclusive [from, to] bounds on created_at (D7-05).
func (r *Postgres) BusinessCount(ctx context.Context, from, to time.Time) (int64, error) {
	query := `SELECT COUNT(*) FROM businesses`
	args := []any{}
	if !from.IsZero() || !to.IsZero() {
		query = `SELECT COUNT(*) FROM businesses WHERE `
		conditions := []string{}
		if !from.IsZero() {
			args = append(args, from)
			conditions = append(conditions, fmt.Sprintf("created_at >= $%d::date", len(args)))
		}
		if !to.IsZero() {
			args = append(args, to)
			conditions = append(conditions, fmt.Sprintf("created_at <= $%d::date", len(args)))
		}
		query += strings.Join(conditions, " AND ")
	}
	var n int64
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&n); err != nil {
		return 0, fmt.Errorf("business count: %w", err)
	}
	return n, nil
}

// ReviewCount returns the number of reviews (D4-07), same single-row pattern
// as BusinessCount. Optional inclusive [from, to] bounds on review_date
// (D7-05).
func (r *Postgres) ReviewCount(ctx context.Context, from, to time.Time) (int64, error) {
	query := `SELECT COUNT(*) FROM reviews`
	args := []any{}
	if !from.IsZero() || !to.IsZero() {
		query = `SELECT COUNT(*) FROM reviews WHERE `
		conditions := []string{}
		if !from.IsZero() {
			args = append(args, from)
			conditions = append(conditions, fmt.Sprintf("review_date >= $%d::date", len(args)))
		}
		if !to.IsZero() {
			args = append(args, to)
			conditions = append(conditions, fmt.Sprintf("review_date <= $%d::date", len(args)))
		}
		query += strings.Join(conditions, " AND ")
	}
	var n int64
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&n); err != nil {
		return 0, fmt.Errorf("review count: %w", err)
	}
	return n, nil
}

// AverageRating returns the mean review rating (D4-08). AVG over an empty
// table is NULL, so COALESCE keeps the float64 contract total: an empty
// reviews table reads 0 instead of failing the scan. Optional inclusive
// [from, to] bounds on review_date (D7-05).
func (r *Postgres) AverageRating(ctx context.Context, from, to time.Time) (float64, error) {
	query := `SELECT COALESCE(AVG(rating), 0) FROM reviews`
	args := []any{}
	if !from.IsZero() || !to.IsZero() {
		query = `SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE `
		conditions := []string{}
		if !from.IsZero() {
			args = append(args, from)
			conditions = append(conditions, fmt.Sprintf("review_date >= $%d::date", len(args)))
		}
		if !to.IsZero() {
			args = append(args, to)
			conditions = append(conditions, fmt.Sprintf("review_date <= $%d::date", len(args)))
		}
		query += strings.Join(conditions, " AND ")
	}
	var avg float64
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&avg); err != nil {
		return 0, fmt.Errorf("average rating: %w", err)
	}
	return avg, nil
}

// BusinessesByCategory returns per-category business counts (D4-11), one row
// per category via GROUP BY. The LEFT JOIN keeps categories with zero
// businesses visible as zero rows instead of dropping them; ordering by
// count (then slug) keeps the output deterministic for callers and tests.
// A non-empty category slug filters to that category; unknown slugs return
// an empty slice (D4-15). Optional inclusive [from, to] bounds on business
// created_at (D7-05).
func (r *Postgres) BusinessesByCategory(ctx context.Context, category string, from, to time.Time) ([]CategoryCount, error) {
	query := `
		SELECT c.slug, c.name, COUNT(b.id)
		FROM categories c
		LEFT JOIN businesses b ON b.category_id = c.id`
	args := []any{}
	conditions := []string{}
	if category != "" {
		args = append(args, category)
		conditions = append(conditions, fmt.Sprintf("c.slug = $%d", len(args)))
	}
	if !from.IsZero() {
		args = append(args, from)
		conditions = append(conditions, fmt.Sprintf("b.created_at >= $%d::date", len(args)))
	}
	if !to.IsZero() {
		args = append(args, to)
		conditions = append(conditions, fmt.Sprintf("b.created_at <= $%d::date", len(args)))
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += "\nGROUP BY c.slug, c.name\nORDER BY COUNT(b.id) DESC, c.slug ASC"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("businesses by category: %w", err)
	}
	defer rows.Close()

	out := []CategoryCount{}
	for rows.Next() {
		var row CategoryCount
		if err := rows.Scan(&row.Slug, &row.Name, &row.Businesses); err != nil {
			return nil, fmt.Errorf("businesses by category: %w", err)
		}
		out = append(out, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("businesses by category: %w", err)
	}
	return out, nil
}

// ReviewsByMonth returns per-month review volume (D4-12) ascending by month.
// date_trunc floors each review_date to its month start server-side; the
// ::date cast keeps months as plain calendar days. Months with zero reviews
// are absent by construction (review-sourced grouping). Zero from/to leaves
// that bound open (D4-15); bounds are inclusive.
func (r *Postgres) ReviewsByMonth(ctx context.Context, from, to time.Time) ([]MonthlyReviews, error) {
	query := `
		SELECT date_trunc('month', review_date)::date, COUNT(*)
		FROM reviews`
	args := []any{}
	if !from.IsZero() {
		args = append(args, from)
		query += fmt.Sprintf("\nWHERE review_date >= $%d::date", len(args))
	}
	if !to.IsZero() {
		args = append(args, to)
		if len(args) == 1 {
			query += fmt.Sprintf("\nWHERE review_date <= $%d::date", len(args))
		} else {
			query += fmt.Sprintf("\nAND review_date <= $%d::date", len(args))
		}
	}
	query += "\nGROUP BY 1\nORDER BY 1"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("reviews by month: %w", err)
	}
	defer rows.Close()

	out := []MonthlyReviews{}
	for rows.Next() {
		var row MonthlyReviews
		if err := rows.Scan(&row.Month, &row.Reviews); err != nil {
			return nil, fmt.Errorf("reviews by month: %w", err)
		}
		out = append(out, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("reviews by month: %w", err)
	}
	return out, nil
}

// TopBusinesses returns the top businesses by average rating, tie-broken by
// review volume (D4-13). The metric is explicit by design: "top" without an
// ORDER BY is ambiguous. INNER JOIN restricts ranking to rated businesses —
// unreviewed rows carry NULL averages, and PostgreSQL sorts DESC NULLs first,
// which would crown unrated businesses without it. The id tail keeps ties
// fully deterministic. Non-positive limits short-circuit to empty since
// PostgreSQL rejects negative LIMIT. Optional inclusive [from, to] bounds on
// review_date (D7-05).
func (r *Postgres) TopBusinesses(ctx context.Context, limit int, from, to time.Time) ([]TopBusiness, error) {
	if limit <= 0 {
		return []TopBusiness{}, nil
	}
	query := `
		SELECT b.id, b.name, AVG(r.rating), COUNT(r.id)
		FROM businesses b
		INNER JOIN reviews r ON r.business_id = b.id`
	args := []any{}
	conditions := []string{}
	if !from.IsZero() {
		args = append(args, from)
		conditions = append(conditions, fmt.Sprintf("r.review_date >= $%d::date", len(args)))
	}
	if !to.IsZero() {
		args = append(args, to)
		conditions = append(conditions, fmt.Sprintf("r.review_date <= $%d::date", len(args)))
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += "\nGROUP BY b.id, b.name\nORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, b.id ASC"
	args = append(args, limit)
	query += fmt.Sprintf("\nLIMIT $%d", len(args))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("top businesses: %w", err)
	}
	defer rows.Close()

	out := []TopBusiness{}
	for rows.Next() {
		var row TopBusiness
		if err := rows.Scan(&row.ID, &row.Name, &row.AverageRating, &row.ReviewCount); err != nil {
			return nil, fmt.Errorf("top businesses: %w", err)
		}
		out = append(out, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("top businesses: %w", err)
	}
	return out, nil
}

// Compile-time proof that the Repository surface is fully implemented.
var _ Repository = (*Postgres)(nil)
