export class DataServiceError extends Error {
  public readonly method: string;
  public readonly entityType?: string;
  public readonly entityId?: string;
  public readonly innerError?: unknown;

  constructor(
    method: string,
    message: string,
    options?: {
      entityType?: string;
      entityId?: string;
      innerError?: unknown;
    }
  ) {
    const innerMsg = options?.innerError instanceof Error
      ? options.innerError.message
      : options?.innerError ? String(options.innerError) : undefined;
    const fullMessage = innerMsg
      ? `${method}: ${message} — ${innerMsg}`
      : `${method}: ${message}`;

    super(fullMessage);
    this.name = 'DataServiceError';
    this.method = method;
    this.entityType = options?.entityType;
    this.entityId = options?.entityId;
    this.innerError = options?.innerError;
  }
}
