package db

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect builds a PostgreSQL connection pool from databaseURL and verifies
// it with a ping before returning.
//
// A blank URL fails fast with an error naming the variable (never its value).
// Unparseable URLs and unreachable hosts also fail here — with the caller's
// context bounding how long a dead host may block — so the service never
// starts half-connected. Callers own the pool lifecycle and must Close it.
func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	if strings.TrimSpace(databaseURL) == "" {
		return nil, fmt.Errorf("missing required database URL (DATABASE_URL)")
	}

	cfg, err := pgxpool.ParseConfig(strings.TrimSpace(databaseURL))
	if err != nil {
		return nil, fmt.Errorf("invalid DATABASE_URL: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("connect to PostgreSQL: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping PostgreSQL: %w", err)
	}

	return pool, nil
}
