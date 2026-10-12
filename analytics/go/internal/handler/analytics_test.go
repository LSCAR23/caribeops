package handler

import (
	"context"
	"encoding/json"
	"errors"
	"maps"
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"
	"time"

	"caribeops/analytics/internal/repository"
	"caribeops/analytics/internal/service"
)

type fakeAnalyticsProvider struct {
	byCategory []repository.CategoryCount
	byMonth    []repository.MonthlyReviews
	top        []repository.TopBusiness
	err        error

	gotCategory string
	gotFrom     time.Time
	gotTo       time.Time
	gotLimit    int
}

func (f *fakeAnalyticsProvider) BusinessesByCategory(_ context.Context, category string) ([]repository.CategoryCount, error) {
	f.gotCategory = category
	return f.byCategory, f.err
}

func (f *fakeAnalyticsProvider) ReviewsByMonth(_ context.Context, from, to time.Time) ([]repository.MonthlyReviews, error) {
	f.gotFrom, f.gotTo = from, to
	return f.byMonth, f.err
}

func (f *fakeAnalyticsProvider) TopBusinesses(_ context.Context, limit int) ([]repository.TopBusiness, error) {
	f.gotLimit = limit
	return f.top, f.err
}

func checkJSON(t *testing.T, response *httptest.ResponseRecorder, wantCode int) {
	t.Helper()
	if response.Code != wantCode {
		t.Fatalf("expected status %d, got %d", wantCode, response.Code)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", contentType)
	}
}

func TestBusinessesByCategorySuccess(t *testing.T) {
	provider := &fakeAnalyticsProvider{byCategory: []repository.CategoryCount{
		{Slug: "tours", Name: "Tours", Businesses: 16},
	}}

	request := httptest.NewRequest(http.MethodGet, "/analytics/businesses-by-category", nil)
	response := httptest.NewRecorder()

	NewBusinessesByCategoryHandler(provider).ServeHTTP(response, request)

	checkJSON(t, response, http.StatusOK)
	var got []repository.CategoryCount
	if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
		t.Fatalf("expected valid JSON, got error %v", err)
	}
	if len(got) != 1 || got[0] != provider.byCategory[0] {
		t.Errorf("body = %+v, want %+v", got, provider.byCategory)
	}
}

func TestReviewsByMonthSuccess(t *testing.T) {
	month := time.Date(2024, 10, 1, 0, 0, 0, 0, time.UTC)
	provider := &fakeAnalyticsProvider{byMonth: []repository.MonthlyReviews{
		{Month: month, Reviews: 3},
	}}

	request := httptest.NewRequest(http.MethodGet, "/analytics/reviews-by-month", nil)
	response := httptest.NewRecorder()

	NewReviewsByMonthHandler(provider).ServeHTTP(response, request)

	checkJSON(t, response, http.StatusOK)
	var got []repository.MonthlyReviews
	if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
		t.Fatalf("expected valid JSON, got error %v", err)
	}
	if len(got) != 1 || !got[0].Month.Equal(month) || got[0].Reviews != 3 {
		t.Errorf("body = %+v, want month %s with 3 reviews", got, month.Format("2006-01-02"))
	}
}

func TestTopBusinessesSuccess(t *testing.T) {
	provider := &fakeAnalyticsProvider{top: []repository.TopBusiness{
		{ID: "id-1", Name: "Top", AverageRating: 4.5, ReviewCount: 8},
	}}

	request := httptest.NewRequest(http.MethodGet, "/analytics/top-businesses", nil)
	response := httptest.NewRecorder()

	NewTopBusinessesHandler(provider).ServeHTTP(response, request)

	checkJSON(t, response, http.StatusOK)
	var got []repository.TopBusiness
	if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
		t.Fatalf("expected valid JSON, got error %v", err)
	}
	if len(got) != 1 || got[0] != provider.top[0] {
		t.Errorf("body = %+v, want %+v", got, provider.top)
	}
}

func TestAnalyticsFailure(t *testing.T) {
	provider := &fakeAnalyticsProvider{err: errors.New("boom with internals: host=db")}

	for path, h := range map[string]http.Handler{
		"/analytics/businesses-by-category": NewBusinessesByCategoryHandler(provider),
		"/analytics/reviews-by-month":       NewReviewsByMonthHandler(provider),
		"/analytics/top-businesses":         NewTopBusinessesHandler(provider),
	} {
		request := httptest.NewRequest(http.MethodGet, path, nil)
		response := httptest.NewRecorder()

		h.ServeHTTP(response, request)

		if response.Code != http.StatusInternalServerError {
			t.Errorf("%s: expected status %d, got %d", path, http.StatusInternalServerError, response.Code)
		}
		if body := response.Body.String(); body != "{\"error\":\""+pathError(path)+"\"}\n" {
			t.Errorf("%s: expected generic error JSON, got %q", path, body)
		}
	}
}

func pathError(path string) string {
	switch path {
	case "/analytics/businesses-by-category":
		return "businesses by category unavailable"
	case "/analytics/reviews-by-month":
		return "reviews by month unavailable"
	default:
		return "top businesses unavailable"
	}
}

func TestBusinessesByCategoryPassesSlug(t *testing.T) {
	provider := &fakeAnalyticsProvider{}

	request := httptest.NewRequest(http.MethodGet, "/analytics/businesses-by-category?category=tours", nil)
	response := httptest.NewRecorder()

	NewBusinessesByCategoryHandler(provider).ServeHTTP(response, request)

	checkJSON(t, response, http.StatusOK)
	if provider.gotCategory != "tours" {
		t.Errorf("category = %q, want %q", provider.gotCategory, "tours")
	}
}

func TestTopBusinessesLimit(t *testing.T) {
	for _, tc := range []struct {
		name      string
		query     string
		wantCode  int
		wantLimit int
	}{
		{"absent defaults", "/analytics/top-businesses", http.StatusOK, DefaultTopLimit},
		{"valid", "/analytics/top-businesses?limit=2", http.StatusOK, 2},
		{"max", "/analytics/top-businesses?limit=100", http.StatusOK, 100},
		{"zero rejects", "/analytics/top-businesses?limit=0", http.StatusBadRequest, 0},
		{"negative rejects", "/analytics/top-businesses?limit=-3", http.StatusBadRequest, 0},
		{"over max rejects", "/analytics/top-businesses?limit=101", http.StatusBadRequest, 0},
		{"garbage rejects", "/analytics/top-businesses?limit=many", http.StatusBadRequest, 0},
	} {
		provider := &fakeAnalyticsProvider{}
		request := httptest.NewRequest(http.MethodGet, tc.query, nil)
		response := httptest.NewRecorder()

		NewTopBusinessesHandler(provider).ServeHTTP(response, request)

		if response.Code != tc.wantCode {
			t.Errorf("%s: status = %d, want %d", tc.name, response.Code, tc.wantCode)
		}
		if tc.wantCode == http.StatusOK && provider.gotLimit != tc.wantLimit {
			t.Errorf("%s: limit = %d, want %d", tc.name, provider.gotLimit, tc.wantLimit)
		}
	}
}

func TestReviewsByMonthRange(t *testing.T) {
	from := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	to := time.Date(2024, 10, 1, 0, 0, 0, 0, time.UTC)

	provider := &fakeAnalyticsProvider{}
	request := httptest.NewRequest(http.MethodGet, "/analytics/reviews-by-month?from=2024-01-01&to=2024-10-01", nil)
	response := httptest.NewRecorder()

	NewReviewsByMonthHandler(provider).ServeHTTP(response, request)

	checkJSON(t, response, http.StatusOK)
	if !provider.gotFrom.Equal(from) || !provider.gotTo.Equal(to) {
		t.Errorf("range = %v..%v, want %v..%v", provider.gotFrom, provider.gotTo, from, to)
	}
}

func TestReviewsByMonthRejects(t *testing.T) {
	for _, tc := range []struct {
		name  string
		query string
	}{
		{"bad from", "/analytics/reviews-by-month?from=yesterday"},
		{"bad to", "/analytics/reviews-by-month?to=2024-13-01"},
		{"from after to", "/analytics/reviews-by-month?from=2024-10-01&to=2024-01-01"},
	} {
		provider := &fakeAnalyticsProvider{}
		request := httptest.NewRequest(http.MethodGet, tc.query, nil)
		response := httptest.NewRecorder()

		NewReviewsByMonthHandler(provider).ServeHTTP(response, request)

		if response.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, want %d", tc.name, response.Code, http.StatusBadRequest)
		}
	}
}

// TestResponseWireKeys pins the client-visible JSON contract for every
// analytics response shape. Handler tests decode into structs, which is blind
// to tag renames — map-decoding catches a dropped or renamed key. The
// duplication with the struct tags is deliberate: wire renames must be
// conscious.
func TestResponseWireKeys(t *testing.T) {
	month := time.Date(2024, 10, 1, 0, 0, 0, 0, time.UTC)
	for _, tc := range []struct {
		name  string
		value any
		keys  []string
	}{
		{"overview", service.Overview{Businesses: 42, Reviews: 350, AverageRating: 4.2},
			[]string{"average_rating", "businesses", "reviews"}},
		{"category", repository.CategoryCount{Slug: "tours", Name: "Tours", Businesses: 16},
			[]string{"businesses", "name", "slug"}},
		{"month", repository.MonthlyReviews{Month: month, Reviews: 3},
			[]string{"month", "reviews"}},
		{"top", repository.TopBusiness{ID: "id-1", Name: "Top", AverageRating: 4.5, ReviewCount: 8},
			[]string{"average_rating", "id", "name", "review_count"}},
	} {
		raw, err := json.Marshal(tc.value)
		if err != nil {
			t.Fatalf("%s: marshal failed: %v", tc.name, err)
		}
		var decoded map[string]any
		if err := json.Unmarshal(raw, &decoded); err != nil {
			t.Fatalf("%s: unmarshal failed: %v", tc.name, err)
		}
		got := slices.Sorted(maps.Keys(decoded))
		if !slices.Equal(got, tc.keys) {
			t.Errorf("%s: keys = %v, want %v", tc.name, got, tc.keys)
		}
	}
}
