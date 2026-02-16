/**
 * Shared test helpers for provisioning test suites.
 * Extends patterns from test-helpers.ts with provisioning-specific factories.
 */
import { IProvisioningLog, ProvisioningStatus, AuditAction, EntityType, IFieldDefinition } from '../../models';
import { IProvisioningInput } from '../ProvisioningService';
import { IDataService } from '../IDataService';

// ── Factory: IProvisioningInput ──

export function createTestInput(overrides?: Partial<IProvisioningInput>): IProvisioningInput {
  return {
    leadId: 1,
    projectCode: '25-042-01',
    projectName: 'Test Project',
    clientName: 'Test Client',
    division: 'Commercial',
    region: 'Miami',
    requestedBy: 'admin@test.com',
    ...overrides,
  };
}

// ── Factory: IProvisioningLog ──

export function createMockLog(overrides?: Partial<IProvisioningLog>): IProvisioningLog {
  return {
    id: 1,
    projectCode: '25-042-01',
    projectName: 'Test Project',
    leadId: 1,
    status: ProvisioningStatus.Queued,
    currentStep: 0,
    completedSteps: 0,
    retryCount: 0,
    requestedBy: 'admin@test.com',
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createFailedLog(step: number, error: string, overrides?: Partial<IProvisioningLog>): IProvisioningLog {
  return createMockLog({
    status: ProvisioningStatus.Failed,
    failedStep: step,
    errorMessage: error,
    currentStep: step,
    completedSteps: step - 1,
    ...overrides,
  });
}

export function createCompletedLog(overrides?: Partial<IProvisioningLog>): IProvisioningLog {
  return createMockLog({
    status: ProvisioningStatus.Completed,
    currentStep: 7,
    completedSteps: 7,
    siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
    completedAt: new Date().toISOString(),
    ...overrides,
  });
}

// ── Factory: Mock IDataService with all provisioning methods ──

export function createProvisioningMockDataService(): Record<string, jest.Mock> {
  return {
    triggerProvisioning: jest.fn().mockResolvedValue(createMockLog()),
    updateProvisioningLog: jest.fn().mockResolvedValue(createMockLog()),
    getProvisioningStatus: jest.fn().mockResolvedValue(createMockLog()),
    retryProvisioning: jest.fn().mockResolvedValue(createMockLog()),
    updateLead: jest.fn().mockResolvedValue({}),
    logAudit: jest.fn().mockResolvedValue(undefined),
    sendNotification: jest.fn().mockResolvedValue({ id: 1 }),
    getRoles: jest.fn().mockResolvedValue([]),
    getHubSiteUrl: jest.fn().mockResolvedValue('https://hub.sharepoint.com'),
    // Provisioning operation mocks
    createProjectSite: jest.fn().mockResolvedValue({ siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201' }),
    provisionProjectLists: jest.fn().mockResolvedValue(undefined),
    associateWithHubSite: jest.fn().mockResolvedValue(undefined),
    createProjectSecurityGroups: jest.fn().mockResolvedValue(undefined),
    copyTemplateFiles: jest.fn().mockResolvedValue(undefined),
    copyLeadDataToProjectSite: jest.fn().mockResolvedValue(undefined),
    updateSiteProperties: jest.fn().mockResolvedValue(undefined),
    createList: jest.fn().mockResolvedValue(undefined),
  };
}

// ── Timer helpers ──

/**
 * Flush microtask queue. Uses Promise.resolve() which works under fake timers
 * (unlike setTimeout-based approaches that get captured by jest.useFakeTimers).
 */
export async function flushPromises(): Promise<void> {
  await Promise.resolve();
}

/**
 * Advance one provisioning step (500ms simulate delay + flush microtasks).
 * Uses jest.advanceTimersByTimeAsync for reliable async timer resolution.
 */
export async function advanceProvisioningStep(): Promise<void> {
  await jest.advanceTimersByTimeAsync(500);
  await Promise.resolve();
}

/**
 * Advance n provisioning steps sequentially.
 * After all steps, flushes extra time for post-loop completion logic.
 */
export async function advanceAllSteps(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await advanceProvisioningStep();
  }
  // Extra flush for post-loop completion logic (updateLead, notification, hubNav, audit)
  await jest.advanceTimersByTimeAsync(100);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ── Assertion helpers ──

export function expectAuditLogged(
  mockDs: Record<string, jest.Mock>,
  action: AuditAction,
  entityType: EntityType
): void {
  expect(mockDs.logAudit).toHaveBeenCalledWith(
    expect.objectContaining({
      Action: action,
      EntityType: entityType,
    })
  );
}
