import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavLinks from "../NavLinks";
import { clearToken, setToken } from "@/lib/auth";

// Router stub (DateRangeSelector.test.tsx precedent, extended with
// usePathname): NavLinks derives the Login link from the token + route,
// so each test controls state.pathname and the token before rendering.
// The component under test renders LogoutButton, which needs useRouter.
const { push, state } = vi.hoisted(() => ({
  push: vi.fn(),
  state: { pathname: "/" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => state.pathname,
}));

beforeEach(() => {
  push.mockClear();
  state.pathname = "/";
  localStorage.clear();
});

describe("NavLinks", () => {
  it("shows the Login link and no Logout button when anonymous", () => {
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Businesses" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
  });

  it("hides the Login link while a token exists", () => {
    // Token present before render: the mount effect adopts it
    // post-hydration (the server render still included Login).
    setToken("test-token");
    render(<NavLinks />);

    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Businesses" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Logout" }),
    ).toBeInTheDocument();
  });

  it("brings the Login link back after logout on the same instance", () => {
    setToken("test-token");
    const { rerender } = render(<NavLinks />);
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();

    // Logout cleared the token and the route moved to /login — one
    // instance persists (layout island), its effect re-syncs the nav.
    clearToken();
    state.pathname = "/login";
    rerender(<NavLinks />);

    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
  });
});
