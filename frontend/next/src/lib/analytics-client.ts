import { analyticsBaseUrl } from "./analytics-config";
import { ApiError } from "./api-client";

// Minimal GET client for the Go analytics API (D5-11).
// Same contract as apiGet: base URL join, JSON Accept header, and !ok → throw
// so the D3-09 error states branch on it identically. Kept apart from
// api-client.ts, whose contract is documented as the Laravel API — the service
// boundary stays visible in code.
export async function analyticsGet<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${analyticsBaseUrl}${normalizedPath}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 200);
    throw new ApiError(
      response.status,
      `GET ${normalizedPath} failed with status ${response.status}`,
      body.length > 0 ? body : undefined,
    );
  }

  const text = await response.text();
  if (text.length === 0) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
