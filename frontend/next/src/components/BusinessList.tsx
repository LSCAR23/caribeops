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
    <ul className="grid grid-cols-2 gap-[18px] max-[1000px]:grid-cols-1">
      {businesses.map((business) => {
        const rating = formatRating(business.average_rating);
        return (
          <li
            key={business.id}
            className="glass-card glass-hover anim-fade-up relative flex flex-col gap-2 rounded-2xl px-[22px] pt-[22px] pb-5"
          >
            <p className="text-lg font-semibold">
              {/* Stretched link: the whole card is clickable, while the
                  link's accessible name stays the business name. */}
              <Link
                href={`/businesses/${business.id}`}
                className="rounded text-white transition-colors after:absolute after:inset-0 after:rounded-2xl hover:text-brand-200 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-400"
              >
                {business.name}
              </Link>
            </p>
            <p className="text-sm text-ink-600/75">
              <span className="text-brand-300">
                {business.category_name ?? "—"}
              </span>{" "}
              · {business.address}
            </p>
            <p className="flex items-center gap-2 pt-1 text-sm text-ink-700">
              {rating !== null ? (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-accent-400"
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
