"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";

type SubmitStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "error" }
  | { state: "success" };

const inputClassName =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "block text-sm font-medium text-zinc-900 dark:text-zinc-50";

// Login island (D6-12). Mirrors the NewBusinessForm submit seam:
// idle → pending → error|success with a double-submit guard.
// Every server rejection maps to one generic line — the backend
// answers unknown-email and wrong-password identically (D6-02),
// so the UI must never render the response body or status.
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });

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
      // Provisional handoff for D6-13 (owns persistence + redirect):
      // keep the Bearer token where the authenticated area can adopt it.
      localStorage.setItem("caribeops_token", result.token);
      setStatus({ state: "success" });
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
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </div>
        <button
          type="submit"
          disabled={status.state === "pending"}
          className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {status.state === "pending" ? "Logging in…" : "Log in"}
        </button>
      </form>
      {status.state === "error" ? (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Invalid email or password.
        </p>
      ) : null}
      {status.state === "success" ? (
        <p role="status" className="mt-4 text-sm text-teal-700 dark:text-teal-400">
          Logged in successfully.
        </p>
      ) : null}
    </div>
  );
}
