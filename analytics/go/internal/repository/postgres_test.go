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
	got, err := repo.BusinessesByCategory(ctx, "")
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
	got, err := repo.ReviewsByMonth(ctx, time.Time{}, time.Time{})
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

// TestPostgresTopBusinesses is the Day-4 order gate at limit 5: element-wise
// equality with manual SQL plus independent order assertions on the method
// output itself (avg non-increasing, count non-increasing on avg ties), so a
// wrong-but-identical ORDER BY in both queries would still fail.
func TestPostgresTopBusinesses(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live top-businesses check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	const limit = 5
	repo := NewPostgres(pool)
	got, err := repo.TopBusinesses(ctx, limit)
	if err != nil {
		t.Fatalf("TopBusinesses failed: %v", err)
	}

	rows, err := pool.Query(ctx, `
		SELECT b.id, b.name, AVG(r.rating), COUNT(r.id)
		FROM businesses b
		INNER JOIN reviews r ON r.business_id = b.id
		GROUP BY b.id, b.name
		ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, b.id ASC
		LIMIT $1`, limit)
	if err != nil {
		t.Fatalf("direct ranking failed: %v", err)
	}
	defer rows.Close()

	var want []TopBusiness
	for rows.Next() {
		var row TopBusiness
		if err := rows.Scan(&row.ID, &row.Name, &row.AverageRating, &row.ReviewCount); err != nil {
			t.Fatalf("direct scan failed: %v", err)
		}
		want = append(want, row)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("direct rows failed: %v", err)
	}

	for _, row := range got {
		t.Logf("top: id=%s name=%q avg=%.4f reviews=%d", row.ID, row.Name, row.AverageRating, row.ReviewCount)
	}
	if len(got) > limit {
		t.Errorf("TopBusinesses returned %d rows, limit %d", len(got), limit)
	}
	if len(got) != len(want) {
		t.Fatalf("TopBusinesses returned %d rows, direct query %d", len(got), len(want))
	}
	for i := range got {
		if got[i] != want[i] {
			t.Errorf("row %d: method=%+v direct=%+v", i, got[i], want[i])
		}
		if i > 0 {
			prev, cur := got[i-1], got[i]
			if cur.AverageRating > prev.AverageRating {
				t.Errorf("row %d: avg %v after %v — not non-increasing", i, cur.AverageRating, prev.AverageRating)
			}
			if cur.AverageRating == prev.AverageRating && cur.ReviewCount > prev.ReviewCount {
				t.Errorf("row %d: count %d after %d on tied avg — not non-increasing", i, cur.ReviewCount, prev.ReviewCount)
			}
		}
	}
}

// TestPostgresFilteredQueries proves filters differentiate (D4-15): narrower
// inputs return narrower outputs, without hardcoding seed literals.
func TestPostgresFilteredQueries(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live filtered-query checks")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	repo := NewPostgres(pool)

	top2, err := repo.TopBusinesses(ctx, 2)
	if err != nil {
		t.Fatalf("TopBusinesses(2) failed: %v", err)
	}
	if len(top2) != 2 {
		t.Errorf("TopBusinesses(2) returned %d rows, want 2", len(top2))
	}

	tours, err := repo.BusinessesByCategory(ctx, "tours")
	if err != nil {
		t.Fatalf("BusinessesByCategory(tours) failed: %v", err)
	}
	if len(tours) != 1 || tours[0].Slug != "tours" {
		t.Errorf("BusinessesByCategory(tours) = %+v, want the single tours row", tours)
	}

	unknown, err := repo.BusinessesByCategory(ctx, "no-such-category")
	if err != nil {
		t.Fatalf("BusinessesByCategory(unknown) failed: %v", err)
	}
	if len(unknown) != 0 {
		t.Errorf("BusinessesByCategory(unknown) = %+v, want empty", unknown)
	}

	from := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	to := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)
	window, err := repo.ReviewsByMonth(ctx, from, to)
	if err != nil {
		t.Fatalf("ReviewsByMonth(2024) failed: %v", err)
	}
	var sum int64
	for _, row := range window {
		if row.Month.Before(from) || row.Month.After(to) {
			t.Errorf("month %s outside 2024 window", row.Month.Format("2006-01-02"))
		}
		sum += row.Reviews
	}
	total, err := repo.ReviewCount(ctx)
	if err != nil {
		t.Fatalf("ReviewCount failed: %v", err)
	}
	if sum > total {
		t.Errorf("window sum = %d exceeds ReviewCount = %d", sum, total)
	}
	t.Logf("filtered: top2=%d tours=%+v unknown=%d window2024rows=%d sum=%d total=%d",
		len(top2), tours, len(unknown), len(window), sum, total)
}

// TestTopBusinessesNonPositiveLimit covers the guard clause with a nil pool:
// non-positive limits return before touching the database, so this runs with
// no DB and never skips.
func TestTopBusinessesNonPositiveLimit(t *testing.T) {
	repo := NewPostgres(nil)
	for _, limit := range []int{0, -1} {
		rows, err := repo.TopBusinesses(context.Background(), limit)
		if err != nil {
			t.Errorf("limit %d: expected nil error, got %v", limit, err)
		}
		if len(rows) != 0 {
			t.Errorf("limit %d: expected empty, got %+v", limit, rows)
		}
	}
}
