export function stableFilterHash(value: unknown): string {
  return JSON.stringify(value ?? {});
}
