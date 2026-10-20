export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-14"
      aria-busy="true"
    >
      <div className="h-9 w-48 animate-pulse rounded-lg bg-ivory-200" />
      <div className="mt-2 h-5 w-64 animate-pulse rounded-lg bg-ivory-200" />
      <p className="sr-only">Loading businesses…</p>
      {/* Mirrors the resolved 2-column card grid (D5-15 convention). */}
      <ul
        className="mt-6 grid gap-4 sm:grid-cols-2"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <li
            key={index}
            className="space-y-3 rounded-2xl border border-ink-100 bg-surface p-5"
          >
            <div className="h-5 w-2/5 animate-pulse rounded-lg bg-ivory-200" />
            <div className="h-4 w-3/5 animate-pulse rounded-lg bg-ivory-200" />
            <div className="h-4 w-1/4 animate-pulse rounded-lg bg-ivory-200" />
          </li>
        ))}
      </ul>
    </main>
  );
}
