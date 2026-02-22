import type { IDataService } from './IDataService';
import { NotImplementedError } from './NotImplementedError';

/**
 * Creates an IDataService proxy where every method throws NotImplementedError.
 *
 * WHY PROXY: IDataService has 250 methods. Writing explicit stubs for each
 * breaks every time a new method is added. The Proxy auto-handles current
 * and future methods with zero maintenance. Mirrors createDelegatingService.ts.
 *
 * @param backendName  Human-readable backend identifier (e.g. 'AzureSql')
 */
export function createNotImplementedService(backendName: string): IDataService {
  const handler: ProxyHandler<object> = {
    get(_target: object, prop: string | symbol) {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
        return () => `[NotImplementedService:${backendName}]`;
      }
      if (typeof prop === 'symbol') {
        return undefined;
      }
      return (..._args: unknown[]) => {
        throw new NotImplementedError(backendName, String(prop));
      };
    },
  };

  return new Proxy({}, handler) as unknown as IDataService;
}
