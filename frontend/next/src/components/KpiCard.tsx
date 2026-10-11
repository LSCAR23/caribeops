// Presentational KPI card (D3-17). Owns pixels only; the dashboard page
// owns fetching (same split as BusinessList, D3-07). No interactivity.
export default function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
