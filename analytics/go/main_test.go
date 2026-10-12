package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"caribeops/analytics/internal/service"
)

type stubOverviewProvider struct{}

func (stubOverviewProvider) GetOverview(context.Context) (service.Overview, error) {
	return service.Overview{}, nil
}

func TestHealthEndpoint(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	newHandler(stubOverviewProvider{}).ServeHTTP(response, request)

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
