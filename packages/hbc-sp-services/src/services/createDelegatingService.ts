import type { IDataService } from './IDataService';

/**
 * Creates an IDataService proxy that delegates all methods to `inner`,
 * with optional per-method overrides.
 *
 * WHY PROXY: IDataService has 244 methods. Manually listing all delegations
 * breaks every time a new method is added. The Proxy automatically handles
 * any method — present or future — without code changes.
 *
 * @param inner    The real IDataService implementation to delegate to
 * @param overrides Optional partial overrides (e.g., offline-queue wrappers)
 */
export function createDelegatingService(
  inner: IDataService,
  overrides: Partial<IDataService> = {}
): IDataService {
  return new Proxy(inner, {
    get(target: IDataService, prop: string | symbol) {
      // Overrides take priority (offline-queue wrappers, binary attachment hooks)
      if (prop in overrides) {
        const override = (overrides as Record<string | symbol, unknown>)[prop];
        return typeof override === 'function' ? (override as Function).bind(overrides) : override;
      }
      // Delegate everything else to inner service
      const value = (target as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? (value as Function).bind(target) : value;
    },
  }) as IDataService;
}
