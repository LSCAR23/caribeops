"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { apiPost } from "@/lib/api-client";
import { setToken } from "@/lib/auth";

// Login island (D6-12, restyled for the "ojo del caribe" mockup).
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

// Keyboard focus: brand-300 ring on the dark card.
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06232a]";

const cardClassName =
  "mt-8 rounded-2xl border border-white/25 bg-[rgba(6,28,36,0.55)] p-7 shadow-[0_30px_60px_-24px_rgba(2,12,16,0.8)] supports-[backdrop-filter]:bg-[rgba(6,28,36,0.38)] supports-[backdrop-filter]:backdrop-blur-md";

const labelClassName = "block text-sm font-semibold text-brand-100";

// Inputs are transparent so the glass shows through; padding leaves
// room for the leading icon (and the trailing toggle on password).
const inputClassName = `w-full rounded-xl border border-white/25 bg-white/5 py-2.5 pl-11 pr-3.5 text-sm text-white placeholder:text-white/45 transition-colors focus:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40`;

const iconClassName =
  "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-brand-100/70";

const submitClassName = `mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(46,163,158,0.9)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none sm:w-auto ${focusRing}`;

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
          <div className="relative mt-1.5">
            <span className={iconClassName} aria-hidden="true">
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect
                  x="2.5"
                  y="4.5"
                  width="15"
                  height="11"
                  rx="2"
                />
                <path
                  d="M3 6l7 5 7-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <div className="relative mt-1.5">
            <span className={iconClassName} aria-hidden="true">
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="4" y="8.5" width="12" height="8" rx="2" />
                <path
                  d="M7 8.5V6.5a3 3 0 016 0v2"
                  strokeLinecap="round"
                />
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
              className={`${inputClassName} pr-11`}
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
              className={`absolute inset-y-0 right-2.5 flex items-center rounded p-1 text-brand-100/70 transition-colors hover:text-white ${focusRing}`}
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
      </form>
      {status.state === "error" ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-300">
          Invalid email or password.
        </p>
      ) : null}
      {status.state === "success" ? (
        <p role="status" className="mt-4 text-sm font-medium text-brand-100">
          Logged in successfully.
        </p>
      ) : null}
    </div>
  );
}
