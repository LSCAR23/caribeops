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
    <main className="box-border w-full mx-auto max-w-[1360px] px-[clamp(20px,5vw,72px)] pt-14 pb-20">
      <h1 className="text-[clamp(34px,5vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">Businesses</h1>
      <p className="mt-2 text-[15px] text-ink-600/75">
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
