/**
 * Phase 5C: Test helpers for ProvisioningSaga tests.
 */
import type { ISagaContext, ICompensationResult, IIdempotencyToken } from '../../models/IProvisioningSaga';
import type { IProvisioningInput } from '../../models/IProvisioningLog';
import { createProvisioningMockDataService, createTestInput } from './provisioning-test-helpers';
import type { IDataService } from '../IDataService';

export function createSagaContext(overrides?: Partial<ISagaContext>): ISagaContext {
  const mockDs = createProvisioningMockDataService();
  return {
    input: createTestInput(),
    siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
    hubSiteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/hub',
    siteAlias: '2504201',
    idempotencyToken: '25-042-01::2026-02-24T00:00:00.000Z::a1b2',
    completedSteps: [],
    dataService: mockDs as unknown as IDataService,
    ...overrides,
  };
}

export function createCompensationResult(overrides?: Partial<ICompensationResult>): ICompensationResult {
  return {
    step: 1,
    label: 'Create SharePoint Site',
    success: true,
    duration: 150,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function createIdempotencyToken(overrides?: Partial<IIdempotencyToken>): IIdempotencyToken {
  return {
    token: '25-042-01::2026-02-24T00:00:00.000Z::a1b2',
    projectCode: '25-042-01',
    createdAt: '2026-02-24T00:00:00.000Z',
    hexSuffix: 'a1b2',
    ...overrides,
  };
}

export function createMockBroadcast(): jest.Mock {
  return jest.fn();
}
