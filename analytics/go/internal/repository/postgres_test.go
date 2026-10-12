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

// TestPostgresBusinessesByCategory is the Day-4 gate for GROUP BY: the method
// slice must equal an independent manual query element-wise (same deterministic
// ordering in both), and the row sum must tie to the proven BusinessCount —
// no hardcoded category literals, so reseeds can't break it.
func TestPostgresBusinessesByCategory(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live businesses-by-category check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	repo := NewPostgres(pool)
	got, err := repo.BusinessesByCategory(ctx)
	if err != nil {
		t.Fatalf("BusinessesByCategory failed: %v", err)
	}

	rows, err := pool.Query(ctx, `
		SELECT c.slug, c.name, COUNT(b.id)
		FROM categories c
		LEFT JOIN businesses b ON b.category_id = c.id
		GROUP BY c.slug, c.name
		ORDER BY COUNT(b.id) DESC, c.slug ASC`)
	if err != nil {
		t.Fatalf("direct GROUP BY failed: %v", err)
	}
	defer rows.Close()

	var want []CategoryCount
	for rows.Next() {
		var row CategoryCount
		if err := rows.Scan(&row.Slug, &row.Name, &row.Businesses); err != nil {
			t.Fatalf("direct scan failed: %v", err)
		}
		want = append(want, row)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("direct rows failed: %v", err)
	}

	t.Logf("by category: method=%+v direct=%+v", got, want)
	if len(got) != len(want) {
		t.Fatalf("BusinessesByCategory returned %d rows, direct query %d", len(got), len(want))
	}
	var sum int64
	for i := range got {
		if got[i] != want[i] {
			t.Errorf("row %d: method=%+v direct=%+v", i, got[i], want[i])
		}
		sum += got[i].Businesses
	}
	total, err := repo.BusinessCount(ctx)
	if err != nil {
		t.Fatalf("BusinessCount failed: %v", err)
	}
	if sum != total {
		t.Errorf("category sum = %d, BusinessCount = %d", sum, total)
	}
}

// TestPostgresReviewsByMonth mirrors the by-category test for month
// bucketing: element-wise equality with manual SQL (same date_trunc grouping
// both sides, so time.Time values match exactly), rows logged for the Day-4
// "verify a sample month" gate, and the month sum tied to ReviewCount.
func TestPostgresReviewsByMonth(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live reviews-by-month check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	repo := NewPostgres(pool)
	got, err := repo.ReviewsByMonth(ctx)
	if err != nil {
		t.Fatalf("ReviewsByMonth failed: %v", err)
	}

	rows, err := pool.Query(ctx, `
		SELECT date_trunc('month', review_date)::date, COUNT(*)
		FROM reviews
		GROUP BY 1
		ORDER BY 1`)
	if err != nil {
		t.Fatalf("direct date_trunc failed: %v", err)
	}
	defer rows.Close()

	var want []MonthlyReviews
	for rows.Next() {
		var row MonthlyReviews
		if err := rows.Scan(&row.Month, &row.Reviews); err != nil {
			t.Fatalf("direct scan failed: %v", err)
		}
		want = append(want, row)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("direct rows failed: %v", err)
	}

	for _, row := range got {
		t.Logf("month: %s reviews=%d", row.Month.Format("2006-01-02"), row.Reviews)
	}
	if len(got) != len(want) {
		t.Fatalf("ReviewsByMonth returned %d rows, direct query %d", len(got), len(want))
	}
	var sum int64
	for i := range got {
		if !got[i].Month.Equal(want[i].Month) || got[i].Reviews != want[i].Reviews {
			t.Errorf("row %d: method=%+v direct=%+v", i, got[i], want[i])
		}
		sum += got[i].Reviews
	}
	total, err := repo.ReviewCount(ctx)
	if err != nil {
		t.Fatalf("ReviewCount failed: %v", err)
	}
	if sum != total {
		t.Errorf("month sum = %d, ReviewCount = %d", sum, total)
	}
}
