import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// cacheLife/cacheTag only work inside the Next runtime; here they are
// spies so the tests can also pin the tags each read is filed under.
const { cacheLife, cacheTag } = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ cacheLife, cacheTag }));

import {
  getBusiness,
  getBusinesses,
  getOverview,
  getTopBusinesses,
} from "../data";

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  return Promise.resolve(
    new Response(body === undefined ? "" : JSON.stringify(body), { status }),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  cacheLife.mockClear();
  cacheTag.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cached data layer", () => {
  it("builds the business list URL from the filters, skipping empty ones", async () => {
    fetchMock.mockReturnValue(respond(200, { data: [], meta: {} }));

    await getBusinesses({ category: "hotels", search: null, page: "2" });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toMatch(/\/api\/businesses\?category=hotels&page=2$/);
    expect(cacheLife).toHaveBeenCalledWith("minutes");
    expect(cacheTag).toHaveBeenCalledWith("businesses");
  });

  it("returns null for an unknown business instead of throwing", async () => {
    fetchMock.mockReturnValue(respond(404, { message: "Not found" }));

    await expect(getBusiness("missing-id")).resolves.toBeNull();
    expect(cacheTag).toHaveBeenCalledWith("businesses", "business:missing-id");
  });

  it("still throws on other API failures so they are never cached", async () => {
    fetchMock.mockReturnValue(respond(500, { message: "boom" }));

    await expect(getBusiness("some-id")).rejects.toThrow(/status 500/);
  });

  it("passes the date range to Go analytics and tags it", async () => {
    fetchMock.mockReturnValue(respond(200, { businesses: 1, reviews: 2, average_rating: 4 }));

    await getOverview({ from: "2026-01-01", to: "2026-01-31" });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toMatch(/\/analytics\/overview\?from=2026-01-01&to=2026-01-31$/);
    expect(cacheTag).toHaveBeenCalledWith("analytics");
  });

  it("omits the query string when no range is selected", async () => {
    fetchMock.mockReturnValue(respond(200, []));

    await getTopBusinesses({ from: null, to: null });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/analytics\/top-businesses$/);
  });
});
