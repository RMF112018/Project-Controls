import type { IDataService } from '../services/IDataService';
import { MockDataService } from '../services/MockDataService';
import { AzureSqlDataService } from '../adapters/AzureSqlDataService';
import type { IAzureSqlConfig } from '../adapters/AzureSqlDataService';
import { DataverseDataService } from '../adapters/DataverseDataService';
import type { IDataverseConfig } from '../adapters/DataverseDataService';

/** Supported data backend identifiers. */
export type DataBackend = 'sharepoint' | 'azuresql' | 'dataverse';

/** Options for DataProviderFactory.create(). */
export interface IFactoryOptions {
  /**
   * When true and backend is 'sharepoint', returns MockDataService
   * instead of requiring PnP initialization. Used for dev/test.
   */
  useMockForSharePoint?: boolean;
  /** Azure SQL connection config (required when backend is 'azuresql'). */
  azureSqlConfig?: IAzureSqlConfig;
  /** Dataverse environment config (required when backend is 'dataverse'). */
  dataverseConfig?: IDataverseConfig;
}

/**
 * DataProviderFactory — Phase 0.5 pluggable backend entry point.
 *
 * Reads the configured backend from environment or explicit parameter
 * and returns the appropriate IDataService implementation.
 *
 * For 'sharepoint' with PnP initialization, callers should continue using
 * SharePointDataService or StandaloneSharePointDataService directly (they
 * require SPFI injection). The factory's sharepoint path returns
 * MockDataService as a dev/test convenience. Full SharePoint integration
 * through the factory will be added in Phase 3.
 *
 * This factory is ADDITIVE — existing direct instantiation continues to work.
 */
export class DataProviderFactory {
  /**
   * Reads the configured backend from VITE_DATA_SERVICE_BACKEND env var.
   * Falls back to 'sharepoint' (the current production default).
   */
  static getConfiguredBackend(): DataBackend {
    const raw =
      typeof process !== 'undefined' && process.env
        ? process.env.VITE_DATA_SERVICE_BACKEND
        : undefined;

    const backend = (raw || 'sharepoint').toLowerCase().trim();

    if (backend === 'azuresql' || backend === 'dataverse' || backend === 'sharepoint') {
      return backend;
    }

    console.warn(
      `[DataProviderFactory] Unknown backend "${backend}", falling back to "sharepoint".`
    );
    return 'sharepoint';
  }

  /**
   * Creates an IDataService for the given (or configured) backend.
   *
   * @param backend  Override for env-based detection. Defaults to getConfiguredBackend().
   * @param options  Backend-specific configuration.
   */
  static create(backend?: DataBackend, options?: IFactoryOptions): IDataService {
    const resolved = backend ?? DataProviderFactory.getConfiguredBackend();

    switch (resolved) {
      case 'sharepoint':
        if (options?.useMockForSharePoint) {
          return new MockDataService();
        }
        console.warn(
          '[DataProviderFactory] SharePoint backend selected but SPFI not available via factory. ' +
          'Use SharePointDataService.initialize() directly. Returning MockDataService as fallback.'
        );
        return new MockDataService();

      case 'azuresql':
        return AzureSqlDataService.create(options?.azureSqlConfig);

      case 'dataverse':
        return DataverseDataService.create(options?.dataverseConfig);

      default: {
        const _exhaustive: never = resolved;
        throw new Error(`[DataProviderFactory] Unknown backend: ${_exhaustive}`);
      }
    }
  }
}
