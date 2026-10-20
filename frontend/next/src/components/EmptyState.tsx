// Shared zero-result message (D3-18, restyled in the UI redesign).
// Presentational only: callers render it when a fetch succeeded with zero
// rows. Failures keep going through the D3-09 error path, never here.
export default function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-ivory-100/60 px-5 py-8 text-center text-sm text-ink-500">
      {message}
    </p>
  );
}
