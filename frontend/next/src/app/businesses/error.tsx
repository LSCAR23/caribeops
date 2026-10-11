'use client';

import { useEffect } from 'react';

export default function BusinessesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Businesses
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Something went wrong loading businesses. Please try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
      >
        Try again
      </button>
    </main>
  );
}
