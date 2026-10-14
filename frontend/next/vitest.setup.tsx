import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

// No `globals` in this setup, so Testing Library cannot auto-clean the
// document between tests — unmount explicitly (upstream documented
// pattern), otherwise earlier renders leak into later queries.
afterEach(() => {
  cleanup();
});

// next/link needs the App Router context for navigation, which unit
// tests don't provide. Stub it to a plain anchor: component tests
// assert href + text, never client transitions (D6-25).
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));
