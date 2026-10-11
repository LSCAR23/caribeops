"use client";

import { useState } from "react";
import type { Category } from "@/types/category";
import {
  validateBusinessForm,
  type BusinessFormErrors,
  type BusinessFormField,
} from "@/lib/validate-business";

const inputClassName =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "block text-sm font-medium text-zinc-900 dark:text-zinc-50";

const errorClassName = "mt-1 text-sm text-red-600 dark:text-red-400";

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
          className={inputClassName}
        />
        <FieldError message={errors.address} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className={labelClassName}>
            Latitude
          </label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            required
            min={-90}
            max={90}
            step="any"
            className={inputClassName}
          />
          <FieldError message={errors.latitude} />
        </div>
        <div>
          <label htmlFor="longitude" className={labelClassName}>
            Longitude
          </label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            required
            min={-180}
            max={180}
            step="any"
            className={inputClassName}
          />
          <FieldError message={errors.longitude} />
        </div>
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
          className={inputClassName}
        />
        <FieldError message={errors.phone} />
      </div>
      <button
        type="submit"
        className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
      >
        Create business
      </button>
    </form>
  );
}
