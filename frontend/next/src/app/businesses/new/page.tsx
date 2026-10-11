import { connection } from "next/server";
import BusinessForm from "@/components/BusinessForm";
import { apiGet } from "@/lib/api-client";
import type { ApiCollectionResponse } from "@/types/api";
import type { Category } from "@/types/category";

// Rendered per request (never prerendered): the category select must read
// live Laravel data, and builds must not require Laravel to be up.
export const instant = false;

export default async function NewBusinessPage() {
  await connection();
  const result =
    await apiGet<ApiCollectionResponse<Category>>("/api/categories");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        New business
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Fill in the details for the new business.
      </p>
      <BusinessForm categories={result.data} />
    </main>
  );
}
