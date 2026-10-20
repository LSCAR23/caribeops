import type { Review } from "@/types/review";

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="mt-6 text-sm text-ink-500">No reviews found.</p>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-[0_1px_2px_rgba(30,29,25,0.04)]"
        >
          <p className="text-base font-medium text-ink-900">{review.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-accent-500"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118L2.077 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674Z" />
            </svg>
            <span>
              Rating: {review.rating} · {review.review_date}
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {review.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
