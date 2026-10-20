import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DateRangeSelector, {
  formatLocalDate,
  parseLocalDate,
} from "../DateRangeSelector";

// Router/URL stub (SearchInput.test.tsx precedent, D6-25): the island's
// only side effect is router.push, so tests assert those calls. `state`
// lets each test set the current ?from/?to before render. fireEvent is
// used instead of el.click() so React state updates flush inside act.
const { push, state } = vi.hoisted(() => ({
  push: vi.fn(),
  state: { params: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(state.params),
}));

beforeEach(() => {
  push.mockClear();
  state.params = "";
});

describe("DateRangeSelector", () => {
  it("first click on a day sets the start date", () => {
    state.params = "";
    render(<DateRangeSelector />);
    // Closed by default with no URL range: open the picker first.
    fireEvent.click(screen.getByRole("button", { name: "Custom range" }));
    const grid = screen.getByRole("group", { name: /days$/ });
    fireEvent.click(within(grid).getByText("15"));

    const ym = formatLocalDate(new Date()).slice(0, 7);
    expect(push).toHaveBeenLastCalledWith(`/analytics?from=${ym}-15`);
  });

  it("second click sets the end date", () => {
    state.params = "from=2026-05-05";
    render(<DateRangeSelector />);
    const grid = screen.getByRole("group", { name: "May 2026 days" });

    fireEvent.click(within(grid).getByText("20"));
    expect(push).toHaveBeenCalledWith(
      "/analytics?from=2026-05-05&to=2026-05-20",
    );
  });

  it("a completed range marks endpoints pressed and in-between days in range", () => {
    state.params = "from=2026-05-05&to=2026-05-20";
    render(<DateRangeSelector />);
    const grid = screen.getByRole("group", { name: "May 2026 days" });
    expect(
      within(grid).getByRole("button", { name: /May 5, 2026/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(grid).getByRole("button", { name: /May 20, 2026/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(grid).getByRole("button", {
        name: /May 12, 2026.*in selected range/,
      }),
    ).toBeInTheDocument();
  });

  it("clicking the same date as start creates a single-day range", () => {
    state.params = "from=2026-05-05";
    render(<DateRangeSelector />);
    const grid = screen.getByRole("group", { name: "May 2026 days" });

    fireEvent.click(within(grid).getByText("5"));
    expect(push).toHaveBeenCalledWith(
      "/analytics?from=2026-05-05&to=2026-05-05",
    );
  });

  it("clicking a date earlier than start becomes the new start", () => {
    state.params = "from=2026-05-10";
    render(<DateRangeSelector />);
    const grid = screen.getByRole("group", { name: "May 2026 days" });

    fireEvent.click(within(grid).getByText("3"));
    expect(push).toHaveBeenCalledWith("/analytics?from=2026-05-03");
  });

  it("renders a Sunday-first grid with matching leading padding", () => {
    // 1 May 2026 is a Friday, so five blank cells must precede day 1.
    state.params = "from=2026-05-05";
    render(<DateRangeSelector />);

    // The Sunday-first header is aria-hidden (labels live on the day
    // buttons), so assert it by text order rather than by role.
    const dayCells = screen.getAllByRole("button", {
      name: /, May \d+, 2026/,
    });
    expect(dayCells.length).toBe(31);

    const grid = screen.getByRole("group", { name: "May 2026 days" });
    // 1 May 2026 is a Friday (getDay() === 5) → 5 Sunday-first blanks.
    expect(grid.children).toHaveLength(31 + 5);
    expect(grid.children[5]).toHaveTextContent("1");
    expect(grid.children[4]).toBeEmptyDOMElement();
  });

  it("clear removes the range and returns to /analytics", () => {
    state.params = "from=2026-05-05&to=2026-05-20";
    render(<DateRangeSelector />);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(push).toHaveBeenCalledWith("/analytics");
    // Custom picker closes (was open because the URL carried a range).
    expect(
      screen.queryByRole("group", { name: "May 2026 days" }),
    ).not.toBeInTheDocument();
  });

  it("preset buttons compute local from/to for 7/30/90 days", () => {
    render(<DateRangeSelector />);

    const to = new Date();
    const from7 = new Date();
    from7.setDate(to.getDate() - 6); // inclusive: today is day 1
    fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
    expect(push).toHaveBeenCalledWith(
      `/analytics?from=${formatLocalDate(from7)}&to=${formatLocalDate(to)}`,
    );

    const from30 = new Date();
    from30.setDate(to.getDate() - 29);
    fireEvent.click(screen.getByRole("button", { name: "Last 30 days" }));
    expect(push).toHaveBeenCalledWith(
      `/analytics?from=${formatLocalDate(from30)}&to=${formatLocalDate(to)}`,
    );

    const from90 = new Date();
    from90.setDate(to.getDate() - 89);
    fireEvent.click(screen.getByRole("button", { name: "Last 90 days" }));
    expect(push).toHaveBeenCalledWith(
      `/analytics?from=${formatLocalDate(from90)}&to=${formatLocalDate(to)}`,
    );
  });

  it("builds day strings from local components (no UTC shift)", () => {
    // In any timezone west of UTC, toISOString() on local midnight of the
    // 1st yields the 30th/31st of the previous month. formatLocalDate must
    // not shift.
    expect(formatLocalDate(new Date(2026, 4, 1))).toBe("2026-05-01");
    expect(formatLocalDate(new Date(2026, 11, 31))).toBe("2026-12-31");
    expect(formatLocalDate(parseLocalDate("2026-05-01"))).toBe("2026-05-01");

    // Same guarantee through the click path: day 1 of May pushes May 1st.
    state.params = "from=2026-05-05";
    render(<DateRangeSelector />);
    const grid = screen.getByRole("group", { name: "May 2026 days" });
    fireEvent.click(within(grid).getByText("1"));
    expect(push).toHaveBeenCalledWith("/analytics?from=2026-05-01");
  });

  it("shows the selection hint when no range is chosen", () => {
    state.params = "";
    render(<DateRangeSelector />);

    expect(
      screen.getByText("Select a start date, then an end date."),
    ).toBeInTheDocument();
  });
});
