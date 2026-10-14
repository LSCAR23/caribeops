import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionFallback from "../SectionFallback";

describe("SectionFallback", () => {
  it("announces the outage with the section label", () => {
    render(<SectionFallback label="Top businesses" />);

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("Top businesses is unavailable right now.");
    expect(notice).toHaveTextContent("reload to try again.");
  });
});
