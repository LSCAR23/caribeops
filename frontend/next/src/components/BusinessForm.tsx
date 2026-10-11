import type { Category } from "@/types/category";

const inputClassName =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "block text-sm font-medium text-zinc-900 dark:text-zinc-50";

export default function BusinessForm({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <form className="mt-6 space-y-4">
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
