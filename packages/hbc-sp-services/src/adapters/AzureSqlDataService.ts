import type { IDataService } from '../services/IDataService';
import { createNotImplementedService } from '../services/createNotImplementedService';

/** Azure SQL connection config — placeholder for Gen 2 development. */
export interface IAzureSqlConfig {
  /** Azure SQL connection string or API endpoint URL */
  endpoint: string;
  /** Optional: Azure AD token provider for managed identity auth */
  tokenProvider?: () => Promise<string>;
}

/**
 * Azure SQL IDataService adapter — Phase 0.5 skeleton.
 *
 * All 250 IDataService methods throw NotImplementedError.
 * Individual methods will be implemented when Gen 2 development begins.
 */
export class AzureSqlDataService {
  static create(_config?: IAzureSqlConfig): IDataService {
    return createNotImplementedService('AzureSql');
  }
}
