import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchInput from "../SearchInput";

// The island pushes via useRouter on submit (covered by the browser
// proof); unit tests only assert rendered state, so the router is a
// local push stub — no shared setup change (D6-25 precedent asserts
// href + text, never transitions).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SearchInput", () => {
  it("labels the search box and renders the current value", () => {
    render(<SearchInput currentSearch="alpha" currentCategorySlug={null} />);

    expect(screen.getByLabelText("Search businesses")).toHaveValue("alpha");
    expect(
      screen.getByRole("button", { name: "Search" }),
    ).toBeInTheDocument();
  });

  it("links Clear search back preserving the category filter", () => {
    render(
      <SearchInput
        currentSearch="alpha"
        currentCategorySlug="00000000-0000-0000-0000-000000000001"
      />,
    );

    expect(screen.getByRole("link", { name: "Clear search" })).toHaveAttribute(
      "href",
      "/businesses?category=00000000-0000-0000-0000-000000000001",
    );
  });

  it("hides Clear search when no search is active", () => {
    render(<SearchInput currentSearch={null} currentCategorySlug={null} />);

    expect(
      screen.queryByRole("link", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });
});
