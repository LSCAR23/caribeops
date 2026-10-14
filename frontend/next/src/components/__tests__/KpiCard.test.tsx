import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KpiCard from "../KpiCard";

describe("KpiCard", () => {
  it("renders the label and the formatted value", () => {
    render(<KpiCard label="Total businesses" value="40" />);

    expect(screen.getByText("Total businesses")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("renders decimal values verbatim", () => {
    render(<KpiCard label="Average rating" value="3.0" />);

    expect(screen.getByText("Average rating")).toBeInTheDocument();
    expect(screen.getByText("3.0")).toBeInTheDocument();
  });
});
