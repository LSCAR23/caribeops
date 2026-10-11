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
    <ul className="mt-6 space-y-4">
      {businesses.map((business) => {
        const rating = formatRating(business.average_rating);
        return (
          <li
            key={business.id}
            className="border-b border-zinc-200 pb-4 dark:border-zinc-800"
          >
            <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              <Link
                href={`/businesses/${business.id}`}
                className="hover:underline"
              >
                {business.name}
              </Link>
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {business.category_name ?? "—"} · {business.address}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {rating !== null ? `Rating: ${rating}` : "No ratings yet"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
