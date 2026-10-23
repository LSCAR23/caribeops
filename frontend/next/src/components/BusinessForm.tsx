"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Category } from "@/types/category";
import {
  validateBusinessForm,
  type BusinessFormErrors,
  type BusinessFormField,
} from "@/lib/validate-business";
import { buttonClassName, errorClassName, inputClassName, labelClassName } from "@/lib/ui";

// Leaflet touches window/document at import time, so the map picker is
// client-only (D7-31). The loading placeholder keeps the form's layout
// stable while the chunk arrives.
const BusinessLocationPicker = dynamic(
  () => import("./BusinessLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        className="mt-1.5 flex h-72 w-full items-center justify-center rounded-xl border border-ink-200 bg-surface text-sm text-ink-500"
      >
        Loading map…
      </div>
    ),
  },
);

const FIELDS: BusinessFormField[] = [
  "name",
  "description",
  "category_id",
  "type",
  "address",
  "latitude",
  "longitude",
  "website",
  "phone",
];

function FieldError({ message }: { message: string | undefined }) {
  if (message === undefined) {
    return null;
  }
  return (
    <p role="alert" className={errorClassName}>
      {message}
    </p>
  );
}

export default function BusinessForm({
  categories,
  onValid,
}: {
  categories: Category[];
  onValid?: (values: Record<BusinessFormField, string>) => void;
}) {
  const [errors, setErrors] = useState<BusinessFormErrors>({});
  // D7-31: coordinates now come from the map picker. Hidden synced
  // inputs keep the FormData contract (and thus validateBusinessForm +
  // NewBusinessForm's payload coercion) unchanged.
  const [location, setLocation] = useState({ latitude: "", longitude: "" });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
    ) as Record<BusinessFormField, string>;
    const nextErrors = validateBusinessForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onValid?.(values);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="name" className={labelClassName}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={255}
          autoComplete="off"
          className={inputClassName}
        />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label htmlFor="description" className={labelClassName}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          autoComplete="off"
          className={inputClassName}
        />
        <FieldError message={errors.description} />
      </div>
      <div>
        <label htmlFor="category_id" className={labelClassName}>
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          required
          defaultValue=""
          autoComplete="off"
          className={inputClassName}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.category_id} />
      </div>
      <div>
        <label htmlFor="type" className={labelClassName}>
          Type
        </label>
        <input
          id="type"
          name="type"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          className={inputClassName}
        />
        <FieldError message={errors.type} />
      </div>
      <div>
        <label htmlFor="address" className={labelClassName}>
          Address
        </label>
        <textarea
          id="address"
          name="address"
          required
          rows={2}
          autoComplete="off"
          className={inputClassName}
        />
        <FieldError message={errors.address} />
      </div>
      <div>
        <span className={labelClassName}>Location</span>
        <input
          type="hidden"
          name="latitude"
          value={location.latitude}
          readOnly
        />
        <input
          type="hidden"
          name="longitude"
          value={location.longitude}
          readOnly
        />
        <BusinessLocationPicker
          latitude={location.latitude}
          longitude={location.longitude}
          onChange={(latitude, longitude) => setLocation({ latitude, longitude })}
        />
        <FieldError message={errors.latitude} />
        <FieldError message={errors.longitude} />
      </div>
      <div>
        <label htmlFor="website" className={labelClassName}>
          Website
        </label>
        <input
          id="website"
          name="website"
          type="url"
          placeholder="https://example.com"
          autoComplete="off"
          className={inputClassName}
        />
        <FieldError message={errors.website} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClassName}>
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          maxLength={32}
          autoComplete="off"
          className={inputClassName}
        />
        <FieldError message={errors.phone} />
      </div>
      <button
        type="submit"
        className={buttonClassName("primary", "mt-2 w-full sm:w-auto")}
      >
        Create business
      </button>
    </form>
  );
}
