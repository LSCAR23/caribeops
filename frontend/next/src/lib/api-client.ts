import { apiBaseUrl } from "./api-config";

// Thrown by apiGet when Laravel answers with an HTTP error status.
// Carries the numeric status so D3-09 error states can branch on it.
export class ApiError extends Error {
  readonly status: number;
  readonly body?: string;

  constructor(status: number, message: string, body?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// Minimal GET client for the Laravel API (D3-05).
// Centralizes base URL, JSON Accept header, and !ok → throw behavior.
// Pass-through `init` keeps POST/PUT/DELETE usable later (D3-13/15)
// without new helpers; default fetch caching is left untouched (D3-06/08).
export async function apiGet<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
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
