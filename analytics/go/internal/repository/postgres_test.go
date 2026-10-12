package repository

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"caribeops/analytics/internal/db"
)

// TestPostgresBusinessCount is the Day-4 gate: the Go result must equal a
// direct PostgreSQL query. Equality — not a hardcoded count — keeps the test
// valid across reseeds. Skips without DATABASE_URL so the default suite stays
// green with no DB running.
func TestPostgresBusinessCount(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live business-count check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	got, err := NewPostgres(pool).BusinessCount(ctx)
	if err != nil {
		t.Fatalf("BusinessCount failed: %v", err)
	}

	var want int64
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM businesses`).Scan(&want); err != nil {
		t.Fatalf("direct COUNT(*) failed: %v", err)
	}

	t.Logf("businesses: method=%d direct=%d", got, want)
	if got != want {
		t.Errorf("BusinessCount = %d, direct query = %d", got, want)
	}
}

// TestPostgresReviewCount mirrors TestPostgresBusinessCount for the reviews
// table: method result must equal an independent direct query.
func TestPostgresReviewCount(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live review-count check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	got, err := NewPostgres(pool).ReviewCount(ctx)
	if err != nil {
		t.Fatalf("ReviewCount failed: %v", err)
	}

	var want int64
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM reviews`).Scan(&want); err != nil {
		t.Fatalf("direct COUNT(*) failed: %v", err)
	}

	t.Logf("reviews: method=%d direct=%d", got, want)
	if got != want {
		t.Errorf("ReviewCount = %d, direct query = %d", got, want)
	}
}

// TestPostgresAverageRating mirrors the count tests for AVG(rating):
// identical aggregates over identical data convert identically, so exact
// equality against an independent raw query is the correct assertion.
func TestPostgresAverageRating(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live average-rating check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	got, err := NewPostgres(pool).AverageRating(ctx)
	if err != nil {
		t.Fatalf("AverageRating failed: %v", err)
	}

	var want float64
	if err := pool.QueryRow(ctx, `SELECT COALESCE(AVG(rating), 0) FROM reviews`).Scan(&want); err != nil {
		t.Fatalf("direct AVG failed: %v", err)
	}

	t.Logf("average rating: method=%.4f direct=%.4f", got, want)
	if got != want {
		t.Errorf("AverageRating = %v, direct query = %v", got, want)
	}
}
