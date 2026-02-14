import { MockDataService } from '../MockDataService';
import { ILead, ILeadFormData } from '../../models/ILead';
import { IGoNoGoScorecard } from '../../models/IGoNoGoScorecard';
import {
  Stage,
  Region,
  Sector,
  Division,
  DepartmentOfOrigin,
  RoleName,
} from '../../models/enums';

/**
 * Creates a fresh MockDataService instance.
 * Each instance deep-clones mock data, so tests get full isolation.
 */
export function createMockDataService(): MockDataService {
  return new MockDataService();
}

/**
 * Flush all pending microtasks / promises.
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Factory for ILeadFormData with sensible defaults.
 */
export function createTestLeadFormData(overrides?: Partial<ILeadFormData>): ILeadFormData {
  return {
    Title: 'Test Project Alpha',
    ClientName: 'Acme Corp',
    Region: Region.Miami,
    Sector: Sector.Commercial,
    Division: Division.Commercial,
    DepartmentOfOrigin: DepartmentOfOrigin.BusinessDevelopment,
    Stage: Stage.LeadDiscovery,
    CityLocation: 'Miami',
    AddressCity: 'Miami',
    AddressState: 'FL',
    ...overrides,
  } as ILeadFormData;
}

/**
 * Factory for a partial IGoNoGoScorecard with sensible defaults.
 */
export function createTestScorecard(overrides?: Partial<IGoNoGoScorecard>): Partial<IGoNoGoScorecard> {
  return {
    LeadID: 1,
    scores: {},
    ...overrides,
  };
}

/**
 * Creates an in-memory sessionStorage mock for CacheService tests.
 */
export function mockSessionStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}
