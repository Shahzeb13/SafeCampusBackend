import { Organization } from "../organizationTypes.js";

export function isOrganization(data: any): data is Organization {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  if (typeof data.name !== "string" || data.name.trim() === "") {
    return false;
  }

  if (typeof data.slug !== "string" || data.slug.trim() === "") {
    return false;
  }

  if (typeof data.contactEmail !== "string" || data.contactEmail.trim() === "") {
    return false;
  }

  if (data.type !== undefined) {
    const validTypes = ["university", "college", "school", "company", "other"];
    if (!validTypes.includes(data.type)) {
      return false;
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ["active", "inactive", "suspended", "trial"];
    if (!validStatuses.includes(data.status)) {
      return false;
    }
  }

  const optionalStringFields = [
    "description",
    "logoUrl",
    "website",
    "contactPhone",
    "address",
    "city",
    "country"
  ];

  for (const field of optionalStringFields) {
    if (data[field] !== undefined && typeof data[field] !== "string") {
      return false;
    }
  }

  if (data.settings !== undefined) {
    if (typeof data.settings !== "object" || data.settings === null) {
      return false;
    }

    const booleanSettings = [
      "allowSelfRegistration",
      "requireAdminApproval",
      "allowStaffRegistration",
      "allowStudentRegistration"
    ];

    for (const setting of booleanSettings) {
      if (
        data.settings[setting] !== undefined &&
        typeof data.settings[setting] !== "boolean"
      ) {
        return false;
      }
    }
  }

  return true;
}
