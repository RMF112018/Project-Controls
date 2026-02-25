/**
 * Phase 7S3: OData filter sanitization utilities.
 *
 * Prevents OData injection by escaping string values, stripping control characters,
 * enforcing length limits, and providing safe filter-builder functions.
 */

const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/g;

/**
 * Sanitize a string value for use in OData filter expressions.
 * - Strips control characters (U+0000–U+001F, U+007F)
 * - Escapes single quotes (`'` → `''`)
 * - Enforces maximum length
 * - Rejects null/undefined
 */
export function sanitizeODataString(value: unknown, maxLength = 255): string {
  if (value === null || value === undefined) {
    throw new ODataSanitizationError('OData string value must not be null or undefined');
  }
  const str = String(value);
  const cleaned = str.replace(CONTROL_CHAR_REGEX, '');
  const escaped = cleaned.replace(/'/g, "''");
  if (escaped.length > maxLength) {
    return escaped.substring(0, maxLength);
  }
  return escaped;
}

/**
 * Sanitize a numeric value for use in OData filter expressions.
 * Rejects NaN and Infinity.
 */
export function sanitizeODataNumber(value: unknown): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    throw new ODataSanitizationError(`Invalid OData number: ${String(value)}`);
  }
  return num;
}

/**
 * Build a safe `column eq 'value'` OData filter expression.
 */
export function safeODataEq(column: string, value: string): string {
  const sanitized = sanitizeODataString(value);
  return `${column} eq '${sanitized}'`;
}

/**
 * Build a safe `substringof('value', column)` OData filter expression.
 */
export function safeODataSubstringOf(column: string, value: string): string {
  const sanitized = sanitizeODataString(value);
  return `substringof('${sanitized}', ${column})`;
}

export class ODataSanitizationError extends Error {
  public readonly name = 'ODataSanitizationError';
  constructor(message: string) {
    super(message);
  }
}
