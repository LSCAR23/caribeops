package service

import (
	"context"
	"fmt"

	"caribeops/analytics/internal/repository"
)

// Overview is the analytics dashboard summary (D4-09). JSON keys match the
// Day-4 contract so the D4-10 endpoint can serialize this struct directly.
type Overview struct {
	Businesses    int64   `json:"businesses"`
	Reviews       int64   `json:"reviews"`
	AverageRating float64 `json:"average_rating"`
}

// OverviewService combines repository reads into application behavior. It
// depends on the Repository interface — never on SQL or driver details — so
// it is testable with a fake and the handler later depends on this service,
// not on the repository.
type OverviewService struct {
	repo repository.Repository
}

// NewOverviewService wires a repository implementation (or fake) into the
// service.
func NewOverviewService(repo repository.Repository) *OverviewService {
	return &OverviewService{repo: repo}
}

// GetOverview reads the three overview inputs sequentially and composes them.
// Sequential is deliberate: three sub-millisecond local aggregates gain
// nothing from goroutines but would pay concurrency complexity for it.
func (s *OverviewService) GetOverview(ctx context.Context) (Overview, error) {
	businesses, err := s.repo.BusinessCount(ctx)
	if err != nil {
		return Overview{}, fmt.Errorf("overview businesses: %w", err)
	}
	reviews, err := s.repo.ReviewCount(ctx)
	if err != nil {
		return Overview{}, fmt.Errorf("overview reviews: %w", err)
	}
	average, err := s.repo.AverageRating(ctx)
	if err != nil {
		return Overview{}, fmt.Errorf("overview average rating: %w", err)
	}
	return Overview{Businesses: businesses, Reviews: reviews, AverageRating: average}, nil
}
