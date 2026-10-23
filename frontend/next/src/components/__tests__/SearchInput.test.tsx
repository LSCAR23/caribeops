import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SearchInput from "../SearchInput";

// Router stub (D7-29 mock idiom): push AND replace spies, because the
// live-search island (D7-30) pushes the first search from an empty
// state and replaces every refinement after it.
const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  push.mockClear();
  replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchInput", () => {
  it("labels the search box and renders the current value", () => {
    render(<SearchInput currentSearch="alpha" currentCategorySlug={null} />);

    expect(screen.getByLabelText("Search businesses")).toHaveValue("alpha");
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

  it("debounces typing: no navigation until the pause, then a push", () => {
    render(<SearchInput currentSearch={null} currentCategorySlug={null} />);

    fireEvent.change(screen.getByLabelText("Search businesses"), {
      target: { value: "beach" },
    });
    expect(push).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/businesses?search=beach");
    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces (never pushes) once a search is already active", () => {
    const { rerender } = render(
      <SearchInput currentSearch="bea" currentCategorySlug={null} />,
    );
    // The URL caught up with the first search (props move with
    // navigation); now the user refines it.
    rerender(<SearchInput currentSearch="bea" currentCategorySlug={null} />);

    fireEvent.change(screen.getByLabelText("Search businesses"), {
      target: { value: "beach" },
    });
    vi.advanceTimersByTime(300);

    expect(replace).toHaveBeenCalledWith("/businesses?search=beach");
    expect(push).not.toHaveBeenCalled();
  });

  it("flushes immediately on Enter without waiting for the debounce", () => {
    render(<SearchInput currentSearch={null} currentCategorySlug={null} />);

    fireEvent.change(screen.getByLabelText("Search businesses"), {
      target: { value: "reef" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledWith("/businesses?search=reef");
    // The pending debounce timer was cancelled: advancing must not
    // navigate a second time.
    vi.advanceTimersByTime(300);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("clears the input when the URL search goes away (Clear/back)", () => {
    // One instance across both renders: with the old remount-by-key
    // this worked only because the whole component was recreated;
    // the controlled input must now follow the prop (D7-30).
    const { rerender } = render(
      <SearchInput currentSearch="alpha" currentCategorySlug={null} />,
    );
    expect(screen.getByLabelText("Search businesses")).toHaveValue("alpha");

    rerender(<SearchInput currentSearch={null} currentCategorySlug={null} />);
    expect(screen.getByLabelText("Search businesses")).toHaveValue("");
  });
});
