import { MockDataService } from './MockDataService';

/**
 * LocalDataService (Phase 1 Week 5 parity hardening)
 *
 * The current implementation layers on top of MockDataService behavior so
 * all IDataService contracts are available in local/offline contexts while
 * Dexie-backed persistence is phased in behind feature flags.
 */
export class LocalDataService extends MockDataService {
  public readonly mode = 'local';
}
