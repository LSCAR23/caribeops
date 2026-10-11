export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12" aria-busy="true">
      <div className="h-9 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-5 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <p className="sr-only">Loading businesses…</p>
      <ul className="mt-6 space-y-4" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <li
            key={index}
            className="space-y-2 border-b border-zinc-200 pb-4 dark:border-zinc-800"
          >
            <div className="h-5 w-2/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </li>
        ))}
      </ul>
    </main>
  );
}
