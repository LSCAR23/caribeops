"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { apiPost } from "@/lib/api-client";
import {
  buttonClassName,
  errorClassName,
  inputClassName,
  labelClassName,
} from "@/lib/ui";
import type { ApiItemResponse } from "@/types/api";
import type { Review } from "@/types/review";

type SubmitStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "sent" }
  | { state: "error"; kind: "empty" | "request" };

const STARS = [1, 2, 3, 4, 5] as const;

// Comment box for a business (D7-30, reworked D7-31). Reviews store
// rating + title + content (no author column), so the form collects all
// three and the server stamps review_date. On 201 it clears the fields
// and calls router.refresh(): the server component re-fetches, the new
// comment lands on top of the (date DESC) list, and no client cache is
// juggled.
//
// D7-31 UX: the form is hidden behind a "Write a review" disclosure
// button (aria-expanded/aria-controls), and the rating select became a
// radiogroup of star buttons (APG pattern: aria-checked, roving
// tabindex, arrow-key navigation) so choosing 1-5 stars works with
// mouse, touch and keyboard alike. Only the <form> collapses; the
// alert/status paragraphs live outside it so "Comment posted." stays
// visible after the form closes on success.
export default function ReviewForm({
  businessId,
}: {
  businessId: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const firstStarRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Move focus to the first star when the form opens; the guard skips the
  // initial mount so page load never steals focus (DOM-only, no state).
  useEffect(() => {
    if (open) {
      firstStarRef.current?.focus();
    }
  }, [open]);

  function handleToggle() {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        // Fresh start: no stale confirmation/error from a prior submit.
        setStatus({ state: "idle" });
      }
      return !wasOpen;
    });
  }

  function handleStarKey(event: React.KeyboardEvent<HTMLButtonElement>, score: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = Math.min(score + 1, 5);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = Math.max(score - 1, 1);
    }
    if (next !== null) {
      event.preventDefault();
      setRating(next);
      const group = event.currentTarget.parentElement;
      const buttons = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[next - 1]?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "pending") {
      return;
    }
    if (rating === 0 || title.trim() === "" || content.trim() === "") {
      setStatus({ state: "error", kind: "empty" });
      return;
    }
    setStatus({ state: "pending" });
    try {
      await apiPost<ApiItemResponse<Review>>(
        `/api/businesses/${businessId}/reviews`,
        {
          rating,
          title: title.trim(),
          content: content.trim(),
        },
      );
      setRating(0);
      setTitle("");
      setContent("");
      setStatus({ state: "sent" });
      setOpen(false);
      router.refresh();
    } catch {
      setStatus({ state: "error", kind: "request" });
    }
  }

  return (
    <div
      className={
        status.state === "pending" ? "pointer-events-none opacity-70" : undefined
      }
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="review-form"
        onClick={handleToggle}
        className={buttonClassName("secondary", "mt-4")}
      >
        {open ? "Hide review form" : "Write a review"}
      </button>
      <div id="review-form">
        {open ? (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <span className={labelClassName}>Rating</span>
              <div
                role="radiogroup"
                aria-label="Rating"
                className="mt-1.5 flex items-center gap-1"
              >
                {STARS.map((score, index) => (
                  <button
                    key={score}
                    ref={index === 0 ? firstStarRef : undefined}
                    type="button"
                    role="radio"
                    aria-checked={score === rating}
                    aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
                    tabIndex={score === (rating || 1) ? 0 : -1}
                    onClick={() => setRating(score)}
                    onKeyDown={(event) => handleStarKey(event, score)}
                    className={`${buttonClassName("ghost", "px-1 text-2xl leading-none")} ${
                      score <= rating ? "text-accent-400" : "text-ink-400"
                    }`}
                  >
                    {score <= rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="review-title" className={labelClassName}>
                Title
              </label>
              <input
                id="review-title"
                type="text"
                required
                maxLength={255}
                autoComplete="off"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="review-content" className={labelClassName}>
                Comment
              </label>
              <textarea
                id="review-content"
                required
                rows={4}
                autoComplete="off"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className={inputClassName}
              />
            </div>
            <button
              type="submit"
              disabled={status.state === "pending"}
              className={buttonClassName("primary", "mt-2 w-full sm:w-auto")}
            >
              Post comment
            </button>
          </form>
        ) : null}
      </div>
      {status.state === "error" ? (
        <p role="alert" className={errorClassName}>
          {status.kind === "empty"
            ? "Please select a rating and fill in all fields."
            : "Could not post your comment. Please try again."}
        </p>
      ) : null}
      {status.state === "sent" ? (
        <p role="status" className="mt-4 text-sm font-medium text-brand-200">
          Comment posted.
        </p>
      ) : null}
    </div>
  );
}
