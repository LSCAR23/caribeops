import { connection } from "next/server";
import NewBusinessForm from "@/components/NewBusinessForm";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
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
    <PageContainer className="max-w-2xl">
      <section className="anim-fade-up">
        <SectionHeading as="h1">New business</SectionHeading>
        <p className="mt-2 text-sm text-ink-500">
          Fill in the details for the new business.
        </p>
      </section>
      <Card className="mt-6">
        <NewBusinessForm categories={result.data} />
      </Card>
    </PageContainer>
  );
}
