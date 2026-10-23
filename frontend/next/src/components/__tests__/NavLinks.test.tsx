import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavLinks from "../NavLinks";
import { clearToken, setToken } from "@/lib/auth";

// Router stub (DateRangeSelector.test.tsx precedent, extended with
// usePathname). The component under test renders LogoutButton, which
// needs useRouter and reads the token.
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
  it("never shows a Login link, and no Logout button when anonymous", () => {
    render(<NavLinks />);

    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Businesses" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
  });

  it("shows the Logout button and still no Login link while a token exists", () => {
    setToken("test-token");
    render(<NavLinks />);

    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Logout" }),
    ).toBeInTheDocument();
  });

  it("drops the Logout button after logout on the same instance", () => {
    setToken("test-token");
    const { rerender } = render(<NavLinks />);
    expect(
      screen.getByRole("button", { name: "Logout" }),
    ).toBeInTheDocument();

    // Logout cleared the token and the route moved to /login — one
    // instance persists (layout island), its effect re-syncs the nav.
    clearToken();
    state.pathname = "/login";
    rerender(<NavLinks />);

    expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
  });

  it("marks the active section, including nested routes", () => {
    state.pathname = "/businesses/abc";
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: "Businesses" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("toggles the phone burger menu and closes it with Escape", () => {
    render(<NavLinks />);

    const burger = screen.getByRole("button", { name: "Open menu" });
    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(burger).toHaveAttribute("aria-controls", "primary-menu");

    fireEvent.click(burger);
    const closeButton = screen.getByRole("button", { name: "Close menu" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(screen.getByRole("link", { name: "Analytics" }), {
      key: "Escape",
    });
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Open menu" }),
    );
  });
});
