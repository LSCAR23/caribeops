import Link from "next/link";
import EmptyState from "./EmptyState";
import type { Business } from "@/types/business";

export function formatRating(value: Business["average_rating"]): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric.toFixed(1);
}

export default function BusinessList({
  businesses,
}: {
  businesses: Business[];
}) {
  if (businesses.length === 0) {
    return <EmptyState message="No businesses found." />;
  }

  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {businesses.map((business) => {
        const rating = formatRating(business.average_rating);
        return (
          <li
            key={business.id}
            className="anim-fade-up rounded-2xl border border-ink-100 bg-surface p-5 shadow-[0_1px_2px_rgba(30,29,25,0.04),0_8px_24px_-12px_rgba(30,29,25,0.10)] motion-safe:transition-shadow hover:shadow-[0_2px_4px_rgba(30,29,25,0.06),0_12px_32px_-12px_rgba(30,29,25,0.18)]"
          >
            <p className="text-base font-medium">
              <Link
                href={`/businesses/${business.id}`}
                className="rounded text-ink-900 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
              >
                {business.name}
              </Link>
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {business.category_name ?? "—"} · {business.address}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
              {rating !== null ? (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-accent-500"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674Z" />
                  </svg>
                  <span>Rating: {rating}</span>
                </>
              ) : (
                "No ratings yet"
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
