import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BusinessList from "../BusinessList";
import type { Business } from "@/types/business";

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    category_id: "00000000-0000-0000-0000-000000000010",
    category_name: "Hotels",
    name: "Harbor Hotel",
    description: "A hotel by the harbor.",
    type: "Boutique hotel",
    address: "1 Harbor St, Santo Domingo",
    latitude: 18.4861,
    longitude: -69.9312,
    website: null,
    phone: "+1-809-555-0101",
    average_rating: 4.5,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("BusinessList", () => {
  it("renders every business name in order with links", () => {
    const rows = [
      business({ id: "id-1", name: "Alpha Inn" }),
      business({ id: "id-2", name: "Beta Resort" }),
    ];
    render(<BusinessList businesses={rows} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Alpha Inn")).toBeInTheDocument();
    expect(within(items[1]).getByText("Beta Resort")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alpha Inn" })).toHaveAttribute(
      "href",
      "/businesses/id-1",
    );
  });

  it("formats ratings and falls back when missing", () => {
    render(
      <BusinessList
        businesses={[
          business({ id: "id-1", name: "Rated", average_rating: 3.04 }),
          business({ id: "id-2", name: "Unrated", average_rating: null }),
        ]}
      />,
    );

    expect(screen.getByText("Rating: 3.0")).toBeInTheDocument();
    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
  });

  it("renders the empty state when there are no businesses", () => {
    render(<BusinessList businesses={[]} />);

    expect(screen.getByText("No businesses found.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
