import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "../LoginForm";
import { getToken } from "@/lib/auth";

// Router + API stub (LogoutButton.test.tsx / DateRangeSelector.test.tsx
// precedent). apiPost is a vi.fn so the happy path, the generic error
// and the double-submit guard can each assert on call counts without a
// backend. setToken is the REAL lib function, so the happy path proves
// the token actually lands in localStorage.
const { push, apiPost } = vi.hoisted(() => ({
  push: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api-client", () => ({
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

beforeEach(() => {
  push.mockClear();
  apiPost.mockClear();
  localStorage.clear();
});

describe("LoginForm", () => {
  it("renders the email/password contract and a show-password toggle", () => {
    render(<LoginForm />);

    // e2e contract (auth-flow.spec.ts): labels + submit name.
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Log in" }),
    ).toBeInTheDocument();
    // Password starts masked.
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    // Toggle is its own control with the initial dynamic label.
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
  });

  it("toggles password visibility and its aria-label", () => {
    render(<LoginForm />);

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    fireEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    // Label flips; getByLabel("Password") still resolves (contract safe).
    expect(screen.getByLabelText("Password")).toBe(input);
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
  });

  it("submits trimmed credentials, stores the token, navigates to /", async () => {
    apiPost.mockResolvedValue({ token: "tok-123" });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  test@example.com  " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/api/login", {
        email: "test@example.com",
        password: "secret",
      }),
    );
    expect(getToken()).toBe("tok-123");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("shows the generic error line on any server rejection", async () => {
    apiPost.mockRejectedValue(new Error("backend says: unknown email"));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nobody@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Invalid email or password.");
    // The generic contract: never leak the response/body, never redirect.
    expect(alert).not.toHaveTextContent("unknown email");
    expect(push).not.toHaveBeenCalled();
    expect(getToken()).toBeNull();
  });

  it("guards against double submit while pending", async () => {
    // A never-resolving promise keeps the button in its pending state so
    // a second click must be a no-op (exactly one request in flight).
    apiPost.mockImplementation(() => new Promise(() => {}));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    const submit = screen.getByRole("button", { name: "Log in" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(apiPost).toHaveBeenCalledTimes(1);
    // Pending state disables the button and shows the progress label.
    expect(
      screen.getByRole("button", { name: "Logging in…" }),
    ).toBeDisabled();
  });
});
