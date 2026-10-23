// Shared zero-result message (D3-18, restyled in the UI redesign).
// Presentational only: callers render it when a fetch succeeded with zero
// rows. Failures keep going through the D3-09 error path, never here.
export default function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-2xl border border-dashed border-[color:var(--field-border)] p-7 text-[15px] text-ink-600/75">
      {message}
    </p>
  );
}
