package config

import (
	"strings"
	"testing"
)

func TestLoadMissingDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("PORT", "")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing DATABASE_URL, got nil")
	}
	if !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Errorf("expected error to name DATABASE_URL, got %q", err.Error())
	}
}

func TestLoadBlankDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "   ")
	t.Setenv("PORT", "")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for blank DATABASE_URL, got nil")
	}
	if !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Errorf("expected error to name DATABASE_URL, got %q", err.Error())
	}
}

func TestLoadDefaultsPort(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://caribeops:caribeops_local@postgres:5432/caribeops?sslmode=disable")
	t.Setenv("PORT", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cfg.Port != DefaultPort {
		t.Errorf("expected default port %q, got %q", DefaultPort, cfg.Port)
	}
	if cfg.DatabaseURL == "" {
		t.Error("expected DatabaseURL to be set")
	}
}

func TestLoadValidPair(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://example/db?sslmode=disable")
	t.Setenv("PORT", "9090")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cfg.Port != "9090" {
		t.Errorf("expected port %q, got %q", "9090", cfg.Port)
	}
	if cfg.DatabaseURL != "postgres://example/db?sslmode=disable" {
		t.Errorf("expected DatabaseURL to round-trip, got %q", cfg.DatabaseURL)
	}
}

func TestLoadInvalidPort(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://example/db?sslmode=disable")

	for _, port := range []string{"abc", "0", "65536", "-1", "80.5"} {
		t.Setenv("PORT", port)

		_, err := Load()
		if err == nil {
			t.Errorf("expected error for PORT=%q, got nil", port)
			continue
		}
		if !strings.Contains(err.Error(), "PORT") {
			t.Errorf("expected error for PORT=%q to name PORT, got %q", port, err.Error())
		}
	}
}
