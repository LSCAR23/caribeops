"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BusinessForm from "./BusinessForm";
import { apiPost } from "@/lib/api-client";
import type { ApiItemResponse } from "@/types/api";
import type { Business } from "@/types/business";
import type { Category } from "@/types/category";
import type { BusinessFormField } from "@/lib/validate-business";

type SubmitStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "error" };

// Submission shell around the validated BusinessForm (D3-15).
// The form's onValid seam guarantees only client-valid values arrive here;
// this layer owns string→payload coercion and the POST + submit states.
// On 201 it navigates to the new business's detail page (D3-16).
export default function NewBusinessForm({
  categories,
}: {
  categories: Category[];
}) {
  const [status, setStatus] = useState<SubmitStatus>({ state: "idle" });
  const router = useRouter();

  async function handleValid(values: Record<BusinessFormField, string>) {
    if (status.state === "pending") {
      return;
    }
    setStatus({ state: "pending" });
    const website = values.website.trim();
    try {
      const created = await apiPost<ApiItemResponse<Business>>(
        "/api/businesses",
        {
          category_id: values.category_id,
          name: values.name.trim(),
          description: values.description.trim(),
          type: values.type.trim(),
          address: values.address.trim(),
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          website: website.length === 0 ? null : website,
          phone: values.phone.trim(),
        },
      );
      router.push(`/businesses/${created.data.id}`);
    } catch {
      setStatus({ state: "error" });
    }
  }

  return (
    <div className={status.state === "pending" ? "pointer-events-none opacity-70" : undefined}>
      <BusinessForm categories={categories} onValid={handleValid} />
      {status.state === "error" ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          Could not create the business. Please try again.
        </p>
      ) : null}
    </div>
  );
}
