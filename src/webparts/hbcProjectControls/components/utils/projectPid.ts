/**
 * HBC-PC-PID-001 — Short project identifier utilities.
 *
 * URLs use a 7-char hex prefix ("pid") derived from the full projectUuid.
 * 16^7 = 268M combinations; collision risk < 0.02% for <10K projects.
 * The 7 chars fall within the first 8-char UUID segment (before the first
 * hyphen), so SharePoint OData `startswith(projectUuid, 'af28129')` matches.
 */

export const PID_LENGTH = 7;

/** Extract the first 7 hex chars from a UUID (hyphens stripped). */
export function toShortPid(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, PID_LENGTH);
}

/** True when value is a full UUID v4 (36 chars with hyphens). */
export function isFullUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** True when value is a valid short pid (7 hex chars). */
export function isShortPid(value: string): boolean {
  return /^[0-9a-f]{7}$/i.test(value);
}

/** Normalize: if full UUID → shorten; if already short pid → pass through. */
export function normalizeToPid(value: string): string {
  if (isFullUuid(value)) return toShortPid(value);
  return value;
}
