"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { apiPost } from "@/lib/api-client";
import { setToken } from "@/lib/auth";

// Login island (D6-12, restyled for the "Login Ojo del Caribe" design).
// The auth logic is UNCHANGED: idle → pending → error|success with a
// double-submit guard, one generic error line for every server
// rejection (the backend answers unknown-email and wrong-password
// identically — D6-02), token persisted, redirect to "/".
//
// Styling: the login card composes the shared glass primitives from
// lib/ui.ts (restyled for the night theme) with a few card-specific
// classes below. The auth logic is unchanged from D6-12.
//
// One behavior beyond auth is the password toggle: a sibling
// <button type="button"> whose accessible name ("Show/Hide password")
// comes from `title` rather than `aria-label`, so Playwright's
// getByLabel("Password") (the e2e/screenshot contract) resolves to the
// field alone, and the toggle never submits the form.
//
// The other addition is the Activity reset (useLayoutEffect below):
// Next 16 keeps this route mounted-but-hidden across navigations, so
// without it the fields would come back filled (old credentials + stale
// status line) after logout.

type SubmitStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "error" }
  | { state: "success" };

// Keyboard focus: yellow ring as in the design (#FFC72C ≈ brand-200).
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc72c] focus-visible:ring-offset-[3px] focus-visible:ring-offset-ivory";

// Warm glass card from the login artboard (lapa theme tokens).
const cardClassName =
  "glass-card box-border flex w-full max-w-[600px] flex-col gap-6 rounded-[24px] p-10 max-[480px]:p-6";

const labelClassName = "block text-[15px] font-semibold text-ink-800";

// The bordered "field" is the wrapper (icon + input [+ toggle]); the
// input itself is transparent. Focus lights the wrapper (focus-within).
const fieldClassName =
  "glass-field mt-2.5 flex h-[56px] items-center gap-3 rounded-[14px] pl-4 max-[480px]:h-[50px]";

const inputClassName =
  "h-full min-w-0 flex-1 border-0 bg-transparent text-base text-ink-800 placeholder:text-ink-700/45 focus:outline-none";

const iconClassName = "pointer-events-none flex-none text-accent-300";

const submitClassName = `btn-accent inline-flex h-14 cursor-pointer items-center gap-2.5 self-start rounded-full px-8 text-base font-bold disabled:opacity-50 disabled:pointer-events-none ${focusRing}`;

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const router = useRouter();

  // Next 16 (`cacheComponents: true`) preserves this route with React's
  // <Activity> in hidden mode instead of unmounting it, so this state —
  // and the controlled inputs — survive login → dashboard and reappear
  // filled, with the stale "Logged in successfully." line, the next time
  // /login is shown (typically right after logout). Reset while the
  // route is hidden: the "Preserving UI state" guide's per-pattern
  // reset (useLayoutEffect cleanup, so nothing can flash on re-show).
  // Credentials are never a draft worth restoring, so the wipe is
  // unconditional — unlike the guide's `shouldReset` contact form.
  useLayoutEffect(() => {
    return () => {
      setEmail("");
      setPassword("");
      setRevealed(false);
      setStatus({ state: "idle" });
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "pending") {
      return;
    }
    setStatus({ state: "pending" });
    try {
      const result = await apiPost<{ token: string }>("/api/login", {
        email: email.trim(),
        password,
      });
      setToken(result.token);
      setStatus({ state: "success" });
      // The spec's transition to the authenticated area (D6-13).
      router.push("/");
    } catch {
      setStatus({ state: "error" });
    }
  }

  return (
    <div
      className={
        status.state === "pending"
          ? "pointer-events-none opacity-70"
          : undefined
      }
    >
      <form className={cardClassName} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <div className={`${fieldClassName} pr-3.5`}>
            <span className={iconClassName} aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <div className={`${fieldClassName} pr-1`}>
            <span className={iconClassName} aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type={revealed ? "text" : "password"}
              required
              autoComplete="current-password"
              spellCheck={false}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
            />
            <button
              type="button"
              onClick={() => setRevealed((current) => !current)}
              // Named via `title` (not `aria-label`) on purpose: the name
              // must remain exactly "Show password"/"Hide password" for
              // getByRole in tests and for assistive tech, but an
              // aria-label containing "password" would also be matched by
              // Playwright's getByLabel("Password") (case-insensitive
              // substring) and collide with the field it controls — the
              // e2e/screenshot contract needs that to resolve to one input.
              // `title` is the accessible-name fallback Playwright's
              // getByLabel does not consider, and doubles as a hover hint.
              title={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              className={`flex size-12 flex-none cursor-pointer items-center justify-center rounded-[10px] text-accent-300 transition-colors hover:text-white ${focusRing}`}
            >
              {revealed ? (
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="10" r="2" />
                  <path
                    d="M3.5 3.5l13 13"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="10" r="2" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="pt-1.5">
        <button
          type="submit"
          disabled={status.state === "pending"}
          className={submitClassName}
        >
          {status.state === "pending" ? "Logging in…" : "Log in"}
          {status.state === "pending" ? null : (
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M4 10h11" strokeLinecap="round" />
              <path
                d="M11 6l4 4-4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        </div>
      </form>
      {status.state === "error" ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-300">
          Invalid email or password.
        </p>
      ) : null}
      {status.state === "success" ? (
        <p role="status" className="mt-4 text-sm font-medium text-brand-200">
          Logged in successfully.
        </p>
      ) : null}
    </div>
  );
}
