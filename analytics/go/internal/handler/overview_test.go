package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"caribeops/analytics/internal/service"
)

type stubProvider struct {
	overview service.Overview
	err      error
}

func (s *stubProvider) GetOverview(context.Context, time.Time, time.Time) (service.Overview, error) {
	return s.overview, s.err
}

func TestOverviewSuccess(t *testing.T) {
	provider := &stubProvider{overview: service.Overview{Businesses: 42, Reviews: 350, AverageRating: 4.2}}

	request := httptest.NewRequest(http.MethodGet, "/analytics/overview", nil)
	response := httptest.NewRecorder()

	NewOverviewHandler(provider).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.Code)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", contentType)
	}
	var got service.Overview
	if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
		t.Fatalf("expected valid overview JSON, got error %v", err)
	}
	if got != provider.overview {
		t.Errorf("overview = %+v, want %+v", got, provider.overview)
	}
}

func TestOverviewFailure(t *testing.T) {
	provider := &stubProvider{err: errors.New("boom with pgxpool internals: host=db secret=x")}

	request := httptest.NewRequest(http.MethodGet, "/analytics/overview", nil)
	response := httptest.NewRecorder()

	NewOverviewHandler(provider).ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, response.Code)
	}
	if body := response.Body.String(); body != "{\"error\":\"overview unavailable\"}\n" {
		t.Errorf("expected generic error JSON, got %q", body)
	}
}
