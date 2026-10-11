package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// DefaultPort preserves the Day-1 hardcoded listen port so the service keeps
// running in environments (like the current Compose setup) that pass no PORT.
const DefaultPort = "8080"

// Config carries the analytics service's environment-provided settings.
// Values are loaded once at startup via Load; handlers and services receive
// them rather than reading the environment themselves.
type Config struct {
	Port        string
	DatabaseURL string
}

// Load reads configuration from the environment.
//
// DATABASE_URL is required: when unset or blank, Load returns an error naming
// the variable (never its value). PORT is optional and defaults to
// DefaultPort; when set it must be numeric in the range 1-65535.
func Load() (Config, error) {
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		return Config{}, fmt.Errorf("missing required environment variable DATABASE_URL")
	}

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = DefaultPort
	} else {
		n, err := strconv.Atoi(port)
		if err != nil || n < 1 || n > 65535 {
			return Config{}, fmt.Errorf("invalid PORT %q: must be a number between 1 and 65535", port)
		}
		port = strconv.Itoa(n)
	}

	return Config{Port: port, DatabaseURL: databaseURL}, nil
}
