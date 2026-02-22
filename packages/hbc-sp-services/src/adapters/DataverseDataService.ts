import type { IDataService } from '../services/IDataService';
import { createNotImplementedService } from '../services/createNotImplementedService';

/** Dataverse environment config — placeholder for Gen 3 development. */
export interface IDataverseConfig {
  /** Dataverse environment URL (e.g. https://org.crm.dynamics.com) */
  environmentUrl: string;
  /** Optional: Token provider for Dataverse auth */
  tokenProvider?: () => Promise<string>;
}

/**
 * Dataverse IDataService adapter — Phase 0.5 skeleton.
 *
 * All 250 IDataService methods throw NotImplementedError.
 * Individual methods will be implemented when Gen 3 development begins.
 */
export class DataverseDataService {
  static create(_config?: IDataverseConfig): IDataService {
    return createNotImplementedService('Dataverse');
  }
}
