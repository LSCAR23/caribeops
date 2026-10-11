import type { Review } from "@/types/review";

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
        No reviews found.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="border-b border-zinc-200 pb-4 dark:border-zinc-800"
        >
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            {review.title}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Rating: {review.rating} · {review.review_date}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {review.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
