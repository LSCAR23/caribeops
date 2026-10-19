package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"caribeops/analytics/internal/repository"
	"caribeops/analytics/internal/service"
)

type stubOverviewProvider struct{}

func (stubOverviewProvider) GetOverview(context.Context, time.Time, time.Time) (service.Overview, error) {
	return service.Overview{}, nil
}

func (stubOverviewProvider) BusinessesByCategory(context.Context, string, time.Time, time.Time) ([]repository.CategoryCount, error) {
	return nil, nil
}

func (stubOverviewProvider) ReviewsByMonth(context.Context, time.Time, time.Time) ([]repository.MonthlyReviews, error) {
	return nil, nil
}

func (stubOverviewProvider) TopBusinesses(context.Context, int, time.Time, time.Time) ([]repository.TopBusiness, error) {
	return nil, nil
}

func TestHealthEndpoint(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	newHandler(stubOverviewProvider{}, stubOverviewProvider{}).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}

	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", contentType)
	}

	if body := response.Body.String(); body != "{\"status\":\"ok\"}\n" {
		t.Errorf("expected health response JSON, got %q", body)
	}
}
