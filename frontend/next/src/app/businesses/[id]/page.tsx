import { connection } from "next/server";

// Per-request rendering like the list: the id is only known at request time,
// and builds must not require Laravel to be up (data fetch arrives in D3-11).
export const instant = false;

export default async function BusinessDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Business {id}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Details coming soon.
      </p>
    </main>
  );
}
