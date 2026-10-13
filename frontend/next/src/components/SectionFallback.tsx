// Per-section outage fallback for analytics islands (D5-16). Pixels only —
// rendered when a Go fetch fails so the section stays headed and honest
// instead of surfacing a raw error digest. Deliberately distinct from
// EmptyState: "unavailable right now" (dependency down) is not "not found"
// (dependency healthy, zero rows). No retry button by design — a page reload
// always re-resolves the island; client refresh machinery is out of scope.
export default function SectionFallback({ label }: { label: string }) {
  return (
    <p
      role="status"
      className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      {label} is unavailable right now. The rest of this page is unaffected —
      reload to try again.
    </p>
  );
}
