package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"caribeops/analytics/internal/repository"
)

type fakeAnalyticsProvider struct {
	byCategory []repository.CategoryCount
	byMonth    []repository.MonthlyReviews
	top        []repository.TopBusiness
	err        error
}

func (f *fakeAnalyticsProvider) BusinessesByCategory(context.Context) ([]repository.CategoryCount, error) {
	return f.byCategory, f.err
}

func (f *fakeAnalyticsProvider) ReviewsByMonth(context.Context) ([]repository.MonthlyReviews, error) {
	return f.byMonth, f.err
}

func (f *fakeAnalyticsProvider) TopBusinesses(context.Context, int) ([]repository.TopBusiness, error) {
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
