// Bearer-token ownership for the Laravel contract (D6-13).
// D6-12 stored the token inline; this module adopts that mechanism
// (localStorage under TOKEN_KEY) so islands share one seam that
// D6-14/15 can extend. Server components have no window, so every
// accessor is guarded and safely returns empty server-side.
const TOKEN_KEY = "caribeops_token";

function storage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function setToken(token: string): void {
  storage()?.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  storage()?.removeItem(TOKEN_KEY);
}

// Authorization header for the Laravel API. Empty when anonymous;
// callers spread this before explicit headers so per-call values win.
export function authHeaders(): Record<string, string> {
  const token = getToken();
  if (token === null || token.length === 0) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
