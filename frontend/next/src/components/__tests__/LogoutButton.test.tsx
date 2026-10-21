import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LogoutButton from "../LogoutButton";
import { getToken, setToken } from "@/lib/auth";

// Router + API stub (DateRangeSelector.test.tsx precedent, extended with
// usePathname): `state.pathname` lets a test move the route BETWEEN
// rerenders of ONE instance — a fresh render() would remount with a
// clean pending state and the round-trip regression below would pass
// even on broken code (D7-29 plan check, finding 2).
const { push, state, apiPost } = vi.hoisted(() => ({
  push: vi.fn(),
  state: { pathname: "/" },
  apiPost: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => state.pathname,
}));

vi.mock("@/lib/api-client", () => ({
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

beforeEach(() => {
  push.mockClear();
  apiPost.mockClear();
  state.pathname = "/";
  localStorage.clear();
});

describe("LogoutButton", () => {
  it("renders nothing when there is no token", () => {
    render(<LogoutButton />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("logs out: posts, clears the token, navigates, shows pending state", async () => {
    setToken("test-token");
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/api/logout", {}),
    );
    expect(getToken()).toBeNull();
    expect(push).toHaveBeenCalledWith("/login");
    // The route mock has not moved, so this same instance still shows
    // the in-flight label — exactly the state that used to leak.
    expect(
      screen.getByRole("button", { name: "Logging out…" }),
    ).toBeDisabled();
  });

  it("shows a fresh enabled Logout after a logout → login round-trip", async () => {
    setToken("test-token");
    const { rerender } = render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));

    // Route lands on /login: the persistent island hides the button.
    state.pathname = "/login";
    rerender(<LogoutButton />);
    expect(screen.queryByRole("button")).toBeNull();

    // Re-login: token back, route back to /. Regression guard — this
    // used to re-render the stale disabled "Logging out…" because
    // pending was never reset (D7-29).
    setToken("test-token");
    state.pathname = "/";
    rerender(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Logout" });
    expect(button).not.toBeDisabled();
  });
});
