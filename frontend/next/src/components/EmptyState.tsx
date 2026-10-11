// Shared zero-result message (D3-18). Presentational only: callers render
// it when a fetch succeeded with zero rows. Failures keep going through
// the D3-09 error path, never here.
export default function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
  );
}
