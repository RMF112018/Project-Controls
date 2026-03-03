// @hbc/data-access — Domain-scoped repository interfaces and adapters

// Port interfaces (contracts)
export * from './ports';

// Types
export type { IRepositories, DataServiceMode, SpConfig } from './types';

// Factory
export { createRepositories } from './factory';

// Mock adapters (for direct use in tests)
export { MockLeadRepository } from './adapters/mock/MockLeadRepository';
export { MockScorecardRepository } from './adapters/mock/MockScorecardRepository';
export { MockEstimatingRepository } from './adapters/mock/MockEstimatingRepository';
export { MockScheduleRepository } from './adapters/mock/MockScheduleRepository';
export { MockBuyoutRepository } from './adapters/mock/MockBuyoutRepository';
export { MockComplianceRepository } from './adapters/mock/MockComplianceRepository';
export { MockContractRepository } from './adapters/mock/MockContractRepository';
export { MockRiskRepository } from './adapters/mock/MockRiskRepository';
export { MockPMPRepository } from './adapters/mock/MockPMPRepository';
export { MockProjectRepository } from './adapters/mock/MockProjectRepository';
export { MockTurnoverRepository } from './adapters/mock/MockTurnoverRepository';
export { MockAuthRepository } from './adapters/mock/MockAuthRepository';
export { MockAuditRepository } from './adapters/mock/MockAuditRepository';
export { MockWorkflowRepository } from './adapters/mock/MockWorkflowRepository';
export { MockInfraRepository } from './adapters/mock/MockInfraRepository';
