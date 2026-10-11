import { connection } from "next/server";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api-client";
import { formatRating } from "@/components/BusinessList";
import ReviewList from "@/components/ReviewList";
import type { ApiCollectionResponse, ApiItemResponse } from "@/types/api";
import type { Business } from "@/types/business";
import type { Review } from "@/types/review";

// Per-request rendering like the list: the id is only known at request time,
// and builds must not require Laravel to be up.
export const instant = false;

export default async function BusinessDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  let business: Business;
  let reviews: Review[];
  try {
    const [businessRes, reviewsRes] = await Promise.all([
      apiGet<ApiItemResponse<Business>>(`/api/businesses/${id}`),
      apiGet<ApiCollectionResponse<Review>>(`/api/businesses/${id}/reviews`),
    ]);
    business = businessRes.data;
    reviews = reviewsRes.data;
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

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {business.name}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {business.category_name ?? "—"} · {business.address}
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {rating !== null ? `Rating: ${rating}` : "No ratings yet"}
      </p>
      <h2 className="mt-8 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Reviews ({reviews.length})
      </h2>
      <ReviewList reviews={reviews} />
    </main>
  );
}
