import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewForm from "../ReviewForm";

// Router + API stub (LogoutButton.test.tsx precedent): refresh must fire
// after a successful POST so the server component re-renders and the new
// comment lands on top of the list (D7-30). D7-31 adds the disclosure
// toggle + star radiogroup on top of that flow.
const { refresh, apiPost, afterReviewCreated } = vi.hoisted(() => ({
  refresh: vi.fn(),
  apiPost: vi.fn(),
  afterReviewCreated: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/api-client", () => ({
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

// Server Action that expires the cached reads after a new review.
vi.mock("@/app/actions/revalidate", () => ({
  afterReviewCreated: (...args: unknown[]) => afterReviewCreated(...args),
}));

beforeEach(() => {
  refresh.mockClear();
  apiPost.mockClear();
  apiPost.mockResolvedValue({ data: { id: "review-1" } });
  afterReviewCreated.mockReset();
  afterReviewCreated.mockResolvedValue(undefined);
});

// Open the disclosure and fill title/comment (padded whitespace so the
// happy path proves the payload is trimmed). The rating is chosen by the
// individual tests via the star buttons.
function openAndFillText(): void {
  fireEvent.click(screen.getByRole("button", { name: "Write a review" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "  Great place  " },
  });
  fireEvent.change(screen.getByLabelText("Comment"), {
    target: { value: " Loved it " },
  });
}

describe("ReviewForm", () => {
  it("keeps the form hidden until the disclosure button is clicked", () => {
    render(<ReviewForm businessId="biz-1" />);

    const toggle = screen.getByRole("button", { name: "Write a review" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Post comment" }),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(
      screen.getByRole("button", { name: "Hide review form" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Post comment" }),
    ).toBeInTheDocument();
  });

  it("marks exactly the clicked star as checked in the radiogroup", () => {
    render(<ReviewForm businessId="biz-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Write a review" }));

    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));

    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
    for (const label of ["1 star", "2 stars", "3 stars", "5 stars"]) {
      expect(screen.getByRole("radio", { name: label })).not.toBeChecked();
    }
  });

  it("blocks a submit without a star choice and sends no request", () => {
    render(<ReviewForm businessId="biz-1" />);
    openAndFillText();

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please select a rating and fill in all fields.",
    );
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("posts the trimmed comment, confirms, collapses the form and refreshes", async () => {
    render(<ReviewForm businessId="biz-1" />);
    openAndFillText();
    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith(
        "/api/businesses/biz-1/reviews",
        {
          rating: 3,
          title: "Great place",
          content: "Loved it",
        },
      ),
    );
    // Confirmation stays visible OUTSIDE the collapsible region (D7-31
    // plan check finding #1) while the form itself closes again.
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Comment posted.",
    );
    // The cache for this business is expired before the re-render.
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(afterReviewCreated).toHaveBeenCalledWith("biz-1");
    expect(
      screen.getByRole("button", { name: "Write a review" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("keeps the form open with the request error when the API rejects", async () => {
    apiPost.mockRejectedValue(new Error("boom"));
    render(<ReviewForm businessId="biz-1" />);
    openAndFillText();
    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not post your comment. Please try again.",
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(afterReviewCreated).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Hide review form" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("clears a stale status message when the form is reopened", async () => {
    apiPost.mockRejectedValue(new Error("boom"));
    render(<ReviewForm businessId="biz-1" />);
    openAndFillText();
    fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));
    await screen.findByRole("alert");

    // Close, then reopen: the old error must be gone (status reset).
    fireEvent.click(screen.getByRole("button", { name: "Hide review form" }));
    fireEvent.click(screen.getByRole("button", { name: "Write a review" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
