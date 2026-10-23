"use server";

import { updateTag } from "next/cache";

// Cache invalidation after a mutation (read-your-own-writes). The writes
// themselves still go from the browser straight to Laravel with the
// user's token; once Laravel confirms, the client calls one of these so
// the cached reads in src/lib/data.ts that the write touched expire
// immediately and the next render shows the new data.
//
// These actions receive no data and write nothing: the worst an
// anonymous caller can do is make the next read refetch from the APIs.

export async function afterBusinessCreated(): Promise<void> {
  updateTag("businesses");
  updateTag("categories");
  updateTag("analytics");
}

export async function afterReviewCreated(businessId: string): Promise<void> {
  updateTag(`business:${businessId}`);
  updateTag("businesses");
  updateTag("analytics");
}
