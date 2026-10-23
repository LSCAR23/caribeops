export default function Loading() {
  return (
    <main
      className="box-border flex w-full flex-col gap-8 mx-auto max-w-[1360px] px-[clamp(20px,5vw,72px)] pt-14 pb-20"
      aria-busy="true"
    >
      <div>
        <div className="h-11 w-56 animate-pulse rounded-lg bg-brand-300/10" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded-lg bg-brand-300/10" />
      </div>
      <p className="sr-only">Loading businesses…</p>
      {/* Mirrors the resolved 2-column card grid (D5-15 convention). */}
      <ul
        className="grid grid-cols-2 gap-[18px] max-[1000px]:grid-cols-1"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <li
            key={index}
            className="glass-card space-y-3 rounded-2xl p-[22px]"
          >
            <div className="h-5 w-2/5 animate-pulse rounded-lg bg-brand-300/10" />
            <div className="h-4 w-3/5 animate-pulse rounded-lg bg-brand-300/10" />
            <div className="h-4 w-1/4 animate-pulse rounded-lg bg-brand-300/10" />
          </li>
        ))}
      </ul>
    </main>
  );
}
