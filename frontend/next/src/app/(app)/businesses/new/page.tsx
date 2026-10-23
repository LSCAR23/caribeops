import { connection } from "next/server";
import NewBusinessForm from "@/components/NewBusinessForm";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";
import { getCategories } from "@/lib/data";

// Categories come from the cached data layer (src/lib/data.ts).
// connection() keeps rendering at request time so builds never need
// Laravel; the cached read is still reused across requests.
export const instant = false;

export default async function NewBusinessPage() {
  await connection();
  const result = await getCategories();

  return (
    <PageContainer className="flex max-w-[860px] flex-col gap-6">
      <section className="anim-fade-up">
        <SectionHeading as="h1">New business</SectionHeading>
        <p className="mt-2 text-[15px] text-ink-600/75">
          Fill in the details for the new business.
        </p>
      </section>
      <Card>
        <NewBusinessForm categories={result.data} />
      </Card>
    </PageContainer>
  );
}
