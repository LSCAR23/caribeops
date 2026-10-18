import { connection } from "next/server";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api-client";
import { formatRating } from "@/components/BusinessList";
import ReviewList from "@/components/ReviewList";
import type { ApiItemResponse } from "@/types/api";
import type { Business } from "@/types/business";

// Per-request rendering like the list: the id is only known at request time,
// and builds must not require Laravel to be up.
// Detail now composes business + owner + amenities + reviews from one
// Laravel endpoint (eager-loaded user, amenities, reviews).
export const instant = false;

export default async function BusinessDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  let business: Business;
  try {
    const businessRes = await apiGet<ApiItemResponse<Business>>(
      `/api/businesses/${id}`,
    );
    business = businessRes.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (business === null || business === undefined) {
    notFound();
  }

  const rating = formatRating(business.average_rating);
  const reviews = business.reviews ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {business.name}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {business.category_name ?? "—"} · {business.address}
      </p>
      {business.owner && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Owner: {business.owner.name}
        </p>
      )}
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {rating !== null ? `Rating: ${rating}` : "No ratings yet"}
      </p>
      {business.amenities?.length && (
        <>
          <h2 className="mt-8 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Amenities
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {business.amenities.join(", ")}
          </p>
        </>
      )}
      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Business information
        </h2>
        {business.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {business.description}
          </p>
        )}
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {business.type}
        </p>
        {business.website && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Website:{business.website}
          </p>
        )}
        {business.phone && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Phone: {business.phone}
          </p>
        )}
      </section>
      <h2 className="mt-8 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Reviews ({reviews.length})
      </h2>
      <ReviewList reviews={reviews} />
    </main>
  );
}
