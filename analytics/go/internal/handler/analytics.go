package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"caribeops/analytics/internal/repository"
)

// DefaultTopLimit caps GET /analytics/top-businesses when ?limit= is absent.
const DefaultTopLimit = 10

// MaxTopLimit bounds ?limit= so one request can't ask for an unbounded ranking.
const MaxTopLimit = 100

// dateLayout is the ?from=/?to= format (D4-15).
const dateLayout = "2006-01-02"

// AnalyticsProvider is the grouped-query surface the D4-14 endpoints need.
// *repository.Postgres satisfies it; tests fake its three methods. If
// coordination logic ever belongs between repository and HTTP, a service can
// interpose behind this same interface without touching the handlers.
type AnalyticsProvider interface {
	BusinessesByCategory(ctx context.Context, category string, from, to time.Time) ([]repository.CategoryCount, error)
	ReviewsByMonth(ctx context.Context, from, to time.Time) ([]repository.MonthlyReviews, error)
	TopBusinesses(ctx context.Context, limit int, from, to time.Time) ([]repository.TopBusiness, error)
}

func writeAnalyticsJSON(w http.ResponseWriter, route string, value any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("%s: write response: %v", route, err)
	}
}

func writeAnalyticsError(w http.ResponseWriter, route, message string, err error) {
	log.Printf("%s: %v", route, err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// writeAnalyticsBadRequest answers malformed query parameters. The offending
// client-supplied value is echoed back; it carries no secrets.
func writeAnalyticsBadRequest(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// NewBusinessesByCategoryHandler serves GET
// /analytics/businesses-by-category. An optional ?category= slug filters to
// that category; unknown slugs return an empty list (listing semantics, never
// 404). Optional ?from=/?to= (YYYY-MM-DD, inclusive) bound business
// created_at; malformed dates or from after to are 400s. Failures log
// server-side; the client gets a generic 500 (full error mapping is D4-16's
// task).
func NewBusinessesByCategoryHandler(provider AnalyticsProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		from, to, err := parseDateRange(query)
		if err != nil {
			writeAnalyticsBadRequest(w, err.Error())
			return
		}
		rows, err := provider.BusinessesByCategory(r.Context(), query.Get("category"), from, to)
		if err != nil {
			writeAnalyticsError(w, "businesses-by-category", "businesses by category unavailable", err)
			return
		}
		writeAnalyticsJSON(w, "businesses-by-category", rows)
	})
}

// NewReviewsByMonthHandler serves GET /analytics/reviews-by-month with the
// same failure contract as its sibling endpoints. Optional ?from=/?to=
// (YYYY-MM-DD, inclusive) bound review_date; malformed dates or from after to
// are 400s.
func NewReviewsByMonthHandler(provider AnalyticsProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		from, err := parseDateParam(query.Get("from"), "from")
		if err != nil {
			writeAnalyticsBadRequest(w, err.Error())
			return
		}
		to, err := parseDateParam(query.Get("to"), "to")
		if err != nil {
			writeAnalyticsBadRequest(w, err.Error())
			return
		}
		if !from.IsZero() && !to.IsZero() && from.After(to) {
			writeAnalyticsBadRequest(w, "invalid date range: from is after to")
			return
		}
		rows, err := provider.ReviewsByMonth(r.Context(), from, to)
		if err != nil {
			writeAnalyticsError(w, "reviews-by-month", "reviews by month unavailable", err)
			return
		}
		writeAnalyticsJSON(w, "reviews-by-month", rows)
	})
}

// parseDateParam converts one YYYY-MM-DD query value; empty means unbounded.
func parseDateParam(value, name string) (time.Time, error) {
	if value == "" {
		return time.Time{}, nil
	}
	parsed, err := time.Parse(dateLayout, value)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid %s %q: must be YYYY-MM-DD", name, value)
	}
	return parsed, nil
}

// NewTopBusinessesHandler serves GET /analytics/top-businesses. ?limit=
// defaults to DefaultTopLimit and clamps at MaxTopLimit; anything else is a
// 400. Optional ?from=/?to= (YYYY-MM-DD, inclusive) bound review_date;
// malformed dates or from after to are 400s. Failure contract matches the
// sibling endpoints.
func NewTopBusinessesHandler(provider AnalyticsProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		from, to, err := parseDateRange(query)
		if err != nil {
			writeAnalyticsBadRequest(w, err.Error())
			return
		}
		limit := DefaultTopLimit
		if raw := query.Get("limit"); raw != "" {
			n, err := strconv.Atoi(raw)
			if err != nil || n < 1 || n > MaxTopLimit {
				writeAnalyticsBadRequest(w, fmt.Sprintf("invalid limit %q: must be a number between 1 and %d", raw, MaxTopLimit))
				return
			}
			limit = n
		}
		rows, err := provider.TopBusinesses(r.Context(), limit, from, to)
		if err != nil {
			writeAnalyticsError(w, "top-businesses", "top businesses unavailable", err)
			return
		}
		writeAnalyticsJSON(w, "top-businesses", rows)
	})
}
