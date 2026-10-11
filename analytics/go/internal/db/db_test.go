package db

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"
)

func TestConnectBlankURL(t *testing.T) {
	for _, url := range []string{"", "   "} {
		_, err := Connect(context.Background(), url)
		if err == nil {
			t.Errorf("expected error for blank URL %q, got nil", url)
			continue
		}
		if !strings.Contains(err.Error(), "DATABASE_URL") {
			t.Errorf("expected error to name DATABASE_URL, got %q", err.Error())
		}
	}
}

func TestConnectUnparseableURL(t *testing.T) {
	_, err := Connect(context.Background(), "://bad::url")
	if err == nil {
		t.Fatal("expected error for unparseable URL, got nil")
	}
	if !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Errorf("expected error to name DATABASE_URL, got %q", err.Error())
	}
}

func TestConnectUnreachableHost(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err := Connect(ctx, "postgres://caribeops:invalid@127.0.0.1:1/caribeops?sslmode=disable")
	if err == nil {
		t.Fatal("expected error for unreachable host, got nil")
	}
}

// TestConnectLiveSELECT1 is the Day-4 gate: execute SELECT 1 against a real
// database. It needs a reachable PostgreSQL, so it skips unless DATABASE_URL
// is set, keeping the default suite green with no DB running.
func TestConnectLiveSELECT1(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(databaseURL) == "" {
		t.Skip("DATABASE_URL unset: skipping live PostgreSQL check")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("expected live connect to succeed, got %v", err)
	}
	defer pool.Close()

	var one int
	if err := pool.QueryRow(ctx, "SELECT 1").Scan(&one); err != nil {
		t.Fatalf("SELECT 1 failed: %v", err)
	}
	if one != 1 {
		t.Errorf("expected SELECT 1 to return 1, got %d", one)
	}
}
