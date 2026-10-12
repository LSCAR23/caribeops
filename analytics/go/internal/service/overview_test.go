package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"caribeops/analytics/internal/repository"
)

// fakeRepository is a hand-written Repository for behavior tests: no DB, no
// SQL. Trio values are configured per test; failOn names one trio method to
// fail. The remaining methods return zeros. Assigning to the interface at
// construction keeps fake and contract in sync at compile time.
type fakeRepository struct {
	businesses int64
	reviews    int64
	average    float64
	failOn     string
}

func (f *fakeRepository) BusinessCount(context.Context) (int64, error) {
	if f.failOn == "businesses" {
		return 0, errors.New("boom businesses")
	}
	return f.businesses, nil
}

func (f *fakeRepository) ReviewCount(context.Context) (int64, error) {
	if f.failOn == "reviews" {
		return 0, errors.New("boom reviews")
	}
	return f.reviews, nil
}

func (f *fakeRepository) AverageRating(context.Context) (float64, error) {
	if f.failOn == "average" {
		return 0, errors.New("boom average")
	}
	return f.average, nil
}

func (f *fakeRepository) BusinessesByCategory(context.Context) ([]repository.CategoryCount, error) {
	return nil, nil
}

func (f *fakeRepository) ReviewsByMonth(context.Context) ([]repository.MonthlyReviews, error) {
	return nil, nil
}

func (f *fakeRepository) TopBusinesses(context.Context, int) ([]repository.TopBusiness, error) {
	return nil, nil
}

func TestGetOverviewCombines(t *testing.T) {
	var repo repository.Repository = &fakeRepository{businesses: 42, reviews: 350, average: 4.2}

	got, err := NewOverviewService(repo).GetOverview(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	want := Overview{Businesses: 42, Reviews: 350, AverageRating: 4.2}
	if got != want {
		t.Errorf("GetOverview = %+v, want %+v", got, want)
	}
}

func TestGetOverviewPropagatesStepErrors(t *testing.T) {
	for _, step := range []string{"businesses", "reviews", "average"} {
		var repo repository.Repository = &fakeRepository{failOn: step}

		_, err := NewOverviewService(repo).GetOverview(context.Background())
		if err == nil {
			t.Errorf("step %q: expected error, got nil", step)
			continue
		}
		if !strings.Contains(err.Error(), "overview") {
			t.Errorf("step %q: expected error to name the overview step, got %q", step, err.Error())
		}
	}
}
