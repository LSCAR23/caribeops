import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import BusinessForm from "../BusinessForm";

// D7-31: the latitude/longitude inputs were replaced by a Leaflet map
// picker that jsdom cannot run. Two-layer stub (plan B4):
// 1. next/dynamic → a minimal async shim that resolves the loader and
//    renders the module's default export, keeping BusinessForm's real
//    dynamic() call site intact.
// 2. The picker module itself → a button that simulates a map click by
//    calling onChange with fixed coordinates.
const { pick } = vi.hoisted(() => ({ pick: vi.fn() }));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default: (props: Record<string, unknown>) => React.JSX.Element }>,
  ) => {
    function DynamicStub(props: Record<string, unknown>) {
      const [Comp, setComp] = useState<
        ((props: Record<string, unknown>) => React.JSX.Element) | null
      >(null);
      useEffect(() => {
        let cancelled = false;
        loader().then((mod) => {
          if (!cancelled) {
            setComp(() => mod.default);
          }
        });
        return () => {
          cancelled = true;
        };
      }, []);
      return Comp ? Comp(props) : null;
    }
    return DynamicStub;
  },
}));

vi.mock("../BusinessLocationPicker", () => ({
  default: (props: { onChange: (lat: string, lng: string) => void }) => (
    <button
      type="button"
      onClick={() => {
        pick();
        props.onChange("9.650000", "-82.750000");
      }}
    >
      Pick on map
    </button>
  ),
}));

const CATEGORIES = [
  { id: "cat-1", name: "Hotels", slug: "hotels" },
  { id: "cat-2", name: "Restaurants", slug: "restaurants" },
];

// Every non-location field, pre-filled with valid values.
function fillVisibleFields(): void {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Playa Azul Hotel" },
  });
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Beachfront rooms in Puerto Viejo." },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "cat-1" },
  });
  fireEvent.change(screen.getByLabelText("Type"), {
    target: { value: "Hotel" },
  });
  fireEvent.change(screen.getByLabelText("Address"), {
    target: { value: "Calle 1, Puerto Viejo" },
  });
  fireEvent.change(screen.getByLabelText("Phone"), {
    target: { value: "+506 2000-1234" },
  });
}

describe("BusinessForm (map-based location, D7-31)", () => {
  it("renders the map picker instead of latitude/longitude number inputs", async () => {
    render(<BusinessForm categories={CATEGORIES} />);

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Pick on map" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Latitude")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Longitude")).not.toBeInTheDocument();
  });

  it("writes the picked coordinates into hidden FormData fields", async () => {
    render(<BusinessForm categories={CATEGORIES} />);

    fireEvent.click(await screen.findByRole("button", { name: "Pick on map" }));

    const latInput = document.querySelector<HTMLInputElement>(
      'input[name="latitude"]',
    );
    const lngInput = document.querySelector<HTMLInputElement>(
      'input[name="longitude"]',
    );
    expect(latInput).not.toBeNull();
    expect(lngInput).not.toBeNull();
    expect(latInput?.value).toBe("9.650000");
    expect(lngInput?.value).toBe("-82.750000");
    expect(pick).toHaveBeenCalledTimes(1);
  });

  it("passes the picked coordinates to onValid on submit", async () => {
    const onValid = vi.fn();
    render(<BusinessForm categories={CATEGORIES} onValid={onValid} />);
    fillVisibleFields();
    fireEvent.click(await screen.findByRole("button", { name: "Pick on map" }));

    fireEvent.click(screen.getByRole("button", { name: "Create business" }));

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: "9.650000",
        longitude: "-82.750000",
        name: "Playa Azul Hotel",
      }),
    );
  });

  it("shows location errors under the map when nothing was picked", async () => {
    const onValid = vi.fn();
    render(<BusinessForm categories={CATEGORIES} onValid={onValid} />);
    fillVisibleFields();

    fireEvent.click(screen.getByRole("button", { name: "Create business" }));

    expect(onValid).not.toHaveBeenCalled();
    expect(
      screen.getByText("Latitude is required."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Longitude is required."),
    ).toBeInTheDocument();
  });
});
