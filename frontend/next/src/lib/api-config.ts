// Central API target for the dashboard (D3-04).
// Read from NEXT_PUBLIC_API_URL so dev/prod can differ without code changes.
// Convention: no trailing slash — callers append "/api/..." paths (D3-05).
export const apiBaseUrl: string = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");
