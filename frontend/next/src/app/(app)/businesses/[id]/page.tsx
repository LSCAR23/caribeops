import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api-client";
import { formatRating } from "@/components/BusinessList";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import { focusRing } from "@/lib/ui";
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
    <PageContainer>
      <section className="anim-fade-up">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          {business.category_name ?? "—"}
        </p>
        <h1 className="mt-2 text-3xl tracking-tight sm:text-4xl">
          {business.name}
        </h1>
        <p className="mt-2 text-sm text-ink-500">{business.address}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-800">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-accent-500"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674Z" />
            </svg>
            <span>
              {rating !== null ? `Rating: ${rating}` : "No ratings yet"}
            </span>
          </span>
          {business.owner && (
            <span className="rounded-full bg-ivory-100 px-3 py-1 font-medium text-ink-700">
              Owner: {business.owner.name}
            </span>
          )}
          <span className="rounded-full bg-ivory-100 px-3 py-1 font-medium text-ink-700">
            {business.type}
          </span>
        </div>
        {business.amenities?.length ? (
          <div className="mt-5">
            <h2 className="text-xl">Amenities</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {business.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <Card className="mt-8">
        <SectionHeading as="h2">Business information</SectionHeading>
        {business.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            {business.description}
          </p>
        )}
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {business.website && (
            <div>
              <dt className="font-medium text-ink-500">Website</dt>
              <dd>
                <Link
                  href={business.website}
                  className={`rounded font-medium text-brand-700 hover:underline underline-offset-4 ${focusRing}`}
                >
                  {business.website}
                </Link>
              </dd>
            </div>
          )}
          {business.phone && (
            <div>
              <dt className="font-medium text-ink-500">Phone</dt>
              <dd className="text-ink-800">{business.phone}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-ink-500">Type</dt>
            <dd className="text-ink-800">{business.type}</dd>
          </div>
        </dl>
      </Card>

      <section className="mt-8">
        <SectionHeading as="h2">Reviews ({reviews.length})</SectionHeading>
        <ReviewForm businessId={business.id} />
        <ReviewList reviews={reviews} />
      </section>
    </PageContainer>
  );
}
