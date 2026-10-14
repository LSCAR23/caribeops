import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ChartSkeleton,
  KpiGridSkeleton,
  RankListSkeleton,
} from "../LoadingSkeleton";

describe("loading skeletons", () => {
  it("marks the KPI grid as busy with an accessible label", () => {
    render(<KpiGridSkeleton />);

    const region = screen.getByLabelText("Loading analytics overview");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("renders the requested chart rows", () => {
    const { container } = render(<ChartSkeleton rows={5} />);
    const region = screen.getByLabelText("Loading chart");

    expect(region).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(15);
  });

  it("renders ten rank rows by default", () => {
    const { container } = render(<RankListSkeleton />);
    const region = screen.getByLabelText("Loading top businesses");

    expect(region).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(30);
  });
});
