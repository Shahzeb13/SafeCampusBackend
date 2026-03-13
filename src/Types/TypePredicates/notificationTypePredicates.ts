export function isNotificationId(value: unknown): value is string {
  return typeof value === "string" && value.length === 24; // Simple MongoDB ObjectId length check
}
