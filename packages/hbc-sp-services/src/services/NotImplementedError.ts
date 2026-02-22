/**
 * Error thrown by placeholder backend adapters (Phase 0.5 stubs).
 * Records both the backend name and the method name for diagnostics.
 */
export class NotImplementedError extends Error {
  public readonly backend: string;
  public readonly method: string;

  constructor(backend: string, method: string) {
    super(
      `[${backend}] Method "${method}" is not implemented — ` +
      `this backend is a Phase 0.5 placeholder. See pluggable-data-backends skill.`
    );
    this.name = 'NotImplementedError';
    this.backend = backend;
    this.method = method;
  }
}
