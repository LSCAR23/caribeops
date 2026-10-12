package repository

import (
	"context"
	"fmt"

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
func (r *Postgres) BusinessCount(ctx context.Context) (int64, error) {
	var n int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM businesses`).Scan(&n); err != nil {
		return 0, fmt.Errorf("business count: %w", err)
	}
	return n, nil
}

// ReviewCount returns the number of reviews (D4-07), same single-row pattern
// as BusinessCount.
func (r *Postgres) ReviewCount(ctx context.Context) (int64, error) {
	var n int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reviews`).Scan(&n); err != nil {
		return 0, fmt.Errorf("review count: %w", err)
	}
	return n, nil
}

// AverageRating returns the mean review rating (D4-08). AVG over an empty
// table is NULL, so COALESCE keeps the float64 contract total: an empty
// reviews table reads 0 instead of failing the scan.
func (r *Postgres) AverageRating(ctx context.Context) (float64, error) {
	var avg float64
	if err := r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(rating), 0) FROM reviews`).Scan(&avg); err != nil {
		return 0, fmt.Errorf("average rating: %w", err)
	}
	return avg, nil
}

// BusinessesByCategory returns per-category business counts (D4-11), one row
// per category via GROUP BY. The LEFT JOIN keeps categories with zero
// businesses visible as zero rows instead of dropping them; ordering by
// count (then slug) keeps the output deterministic for callers and tests.
func (r *Postgres) BusinessesByCategory(ctx context.Context) ([]CategoryCount, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.slug, c.name, COUNT(b.id)
		FROM categories c
		LEFT JOIN businesses b ON b.category_id = c.id
		GROUP BY c.slug, c.name
		ORDER BY COUNT(b.id) DESC, c.slug ASC`)
	if err != nil {
		return nil, fmt.Errorf("businesses by category: %w", err)
	}
	defer rows.Close()

	var out []CategoryCount
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
