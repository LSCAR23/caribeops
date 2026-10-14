import { apiBaseUrl } from "./api-config";
import { authHeaders } from "./auth";

// Thrown by the API client when Laravel answers with an HTTP error status.
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
      ...authHeaders(),
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

// Minimal POST client for the Laravel API (D3-15).
// Same contract as apiGet: base URL join, JSON headers, !ok → throw.
// The submit layer (not this client) owns string→payload coercion.
export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
    ...init,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init?.headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = (await response.text()).slice(0, 200);
    throw new ApiError(
      response.status,
      `POST ${normalizedPath} failed with status ${response.status}`,
      text.length > 0 ? text : undefined,
    );
  }

  const responseText = await response.text();
  if (responseText.length === 0) {
    return undefined as T;
  }
  return JSON.parse(responseText) as T;
}
