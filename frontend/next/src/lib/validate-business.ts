// Client-side mirror of StoreBusinessRequest (backend/laravel).
// Pure and framework-free so the gating logic is provable without a browser.
// The server stays authoritative; this only improves UX (D3-14 learning).

export type BusinessFormField =
  | "name"
  | "description"
  | "category_id"
  | "type"
  | "address"
  | "latitude"
  | "longitude"
  | "website"
  | "phone";

export type BusinessFormErrors = Partial<Record<BusinessFormField, string>>;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateBusinessForm(
  values: Partial<Record<BusinessFormField, string>>,
): BusinessFormErrors {
  const errors: BusinessFormErrors = {};
  const get = (field: BusinessFormField): string =>
    (values[field] ?? "").trim();

  if (isBlank(get("name"))) {
    errors.name = "Name is required.";
  } else if (get("name").length > 255) {
    errors.name = "Name must not exceed 255 characters.";
  }

  if (isBlank(get("description"))) {
    errors.description = "Description is required.";
  }

  if (isBlank(get("category_id"))) {
    errors.category_id = "Category is required.";
  }

  if (isBlank(get("type"))) {
    errors.type = "Type is required.";
  } else if (get("type").length > 120) {
    errors.type = "Type must not exceed 120 characters.";
  }

  if (isBlank(get("address"))) {
    errors.address = "Address is required.";
  }

  const latitude = get("latitude");
  if (isBlank(latitude)) {
    errors.latitude = "Latitude is required.";
  } else {
    const numeric = Number(latitude);
    if (!Number.isFinite(numeric)) {
      errors.latitude = "Latitude must be a number.";
    } else if (numeric < -90 || numeric > 90) {
      errors.latitude = "Latitude must be between -90 and 90.";
    }
  }

  const longitude = get("longitude");
  if (isBlank(longitude)) {
    errors.longitude = "Longitude is required.";
  } else {
    const numeric = Number(longitude);
    if (!Number.isFinite(numeric)) {
      errors.longitude = "Longitude must be a number.";
    } else if (numeric < -180 || numeric > 180) {
      errors.longitude = "Longitude must be between -180 and 180.";
    }
  }

  const website = get("website");
  if (!isBlank(website) && !isValidUrl(website)) {
    errors.website = "Website must be a valid URL.";
  }

  if (isBlank(get("phone"))) {
    errors.phone = "Phone is required.";
  } else if (get("phone").length > 32) {
    errors.phone = "Phone must not exceed 32 characters.";
  }

  return errors;
}
