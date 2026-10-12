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
