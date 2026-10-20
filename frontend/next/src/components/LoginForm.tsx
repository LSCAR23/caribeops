"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { setToken } from "@/lib/auth";
import { buttonClassName, inputClassName, labelClassName } from "@/lib/ui";

type SubmitStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "error" }
  | { state: "success" };

// Login island (D6-12). Mirrors the NewBusinessForm submit seam:
// idle → pending → error|success with a double-submit guard.
// Every server rejection maps to one generic line — the backend
// answers unknown-email and wrong-password identically (D6-02),
// so the UI must never render the response body or status.
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const router = useRouter();

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
            spellCheck={false}
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
            spellCheck={false}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </div>
        <button
          type="submit"
          disabled={status.state === "pending"}
          className={buttonClassName("primary", "w-full sm:w-auto")}
        >
          {status.state === "pending" ? "Logging in…" : "Log in"}
        </button>
      </form>
      {status.state === "error" ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          Invalid email or password.
        </p>
      ) : null}
      {status.state === "success" ? (
        <p role="status" className="mt-4 text-sm font-medium text-brand-700">
          Logged in successfully.
        </p>
      ) : null}
    </div>
  );
}
