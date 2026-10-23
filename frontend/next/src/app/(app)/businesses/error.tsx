'use client';

import { useEffect } from 'react';
import { buttonClassName } from '@/lib/ui';

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
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl tracking-tight">Businesses</h1>
      <p className="mt-2 text-sm text-ink-500">
        Something went wrong loading businesses. Please try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className={buttonClassName('primary', 'mt-6')}
      >
        Try again
      </button>
    </main>
  );
}
