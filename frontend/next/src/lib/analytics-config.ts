// Central analytics target for the dashboard (D5-11).
// Read from NEXT_PUBLIC_ANALYTICS_URL so dev/prod can differ without code changes.
// Convention: no trailing slash — callers append "/analytics/..." paths.
export const analyticsBaseUrl: string = (
  process.env.NEXT_PUBLIC_ANALYTICS_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");
