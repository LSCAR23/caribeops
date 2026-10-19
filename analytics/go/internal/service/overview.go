package service

import (
	"context"
	"fmt"
	"time"
)

// Overview is the analytics dashboard summary (D4-09). JSON keys match the
// Day-4 contract so the D4-10 endpoint can serialize this struct directly.
type Overview struct {
	Businesses    int64   `json:"businesses"`
	Reviews       int64   `json:"reviews"`
	AverageRating float64 `json:"average_rating"`
}

// OverviewRepository is the trio GetOverview needs. It mirrors the matching
// methods of repository.Repository narrowed to this service's use, so the
// partially implemented *repository.Postgres satisfies it today and the
// service stays testable with small fakes. *service.OverviewService in turn
// satisfies handler.OverviewProvider.
type OverviewRepository interface {
	BusinessCount(ctx context.Context, from, to time.Time) (int64, error)
	ReviewCount(ctx context.Context, from, to time.Time) (int64, error)
	AverageRating(ctx context.Context, from, to time.Time) (float64, error)
}

// OverviewService combines repository reads into application behavior. It
// depends on the OverviewRepository interface — never on SQL or driver
// details — so it is testable with a fake and the handler later depends on
// this service, not on the repository.
type OverviewService struct {
	repo OverviewRepository
}

// NewOverviewService wires a repository implementation (or fake) into the
// service.
func NewOverviewService(repo OverviewRepository) *OverviewService {
	return &OverviewService{repo: repo}
}

// GetOverview reads the three overview inputs sequentially and composes them.
// Sequential is deliberate: three sub-millisecond local aggregates gain
// nothing from goroutines but would pay concurrency complexity for it.
// Optional inclusive [from, to] bounds are passed through to each repository
// call (D7-05).
func (s *OverviewService) GetOverview(ctx context.Context, from, to time.Time) (Overview, error) {
	businesses, err := s.repo.BusinessCount(ctx, from, to)
	if err != nil {
		return Overview{}, fmt.Errorf("overview businesses: %w", err)
	}
	reviews, err := s.repo.ReviewCount(ctx, from, to)
	if err != nil {
		return Overview{}, fmt.Errorf("overview reviews: %w", err)
	}
	average, err := s.repo.AverageRating(ctx, from, to)
	if err != nil {
		return Overview{}, fmt.Errorf("overview average rating: %w", err)
	}
	return Overview{Businesses: businesses, Reviews: reviews, AverageRating: average}, nil
}
