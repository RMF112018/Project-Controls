import type { IRepositories, DataServiceMode, SpConfig } from './types';
import { MockLeadRepository } from './adapters/mock/MockLeadRepository';
import { MockScorecardRepository } from './adapters/mock/MockScorecardRepository';
import { MockEstimatingRepository } from './adapters/mock/MockEstimatingRepository';
import { MockScheduleRepository } from './adapters/mock/MockScheduleRepository';
import { MockBuyoutRepository } from './adapters/mock/MockBuyoutRepository';
import { MockComplianceRepository } from './adapters/mock/MockComplianceRepository';
import { MockContractRepository } from './adapters/mock/MockContractRepository';
import { MockRiskRepository } from './adapters/mock/MockRiskRepository';
import { MockPMPRepository } from './adapters/mock/MockPMPRepository';
import { MockProjectRepository } from './adapters/mock/MockProjectRepository';
import { MockTurnoverRepository } from './adapters/mock/MockTurnoverRepository';
import { MockAuthRepository } from './adapters/mock/MockAuthRepository';
import { MockAuditRepository } from './adapters/mock/MockAuditRepository';
import { MockWorkflowRepository } from './adapters/mock/MockWorkflowRepository';
import { MockInfraRepository } from './adapters/mock/MockInfraRepository';

/**
 * Creates the complete set of domain repositories based on the data service mode.
 *
 * - `mock`: In-memory implementations for dev/testing (no external dependencies)
 * - `sharepoint`: PnPjs implementations targeting SharePoint Online lists
 * - `api`: Future REST API implementations
 */
export function createRepositories(mode: DataServiceMode, _config?: SpConfig): IRepositories {
  switch (mode) {
    case 'mock':
      return {
        leads: new MockLeadRepository(),
        scorecards: new MockScorecardRepository(),
        estimating: new MockEstimatingRepository(),
        schedule: new MockScheduleRepository(),
        buyout: new MockBuyoutRepository(),
        compliance: new MockComplianceRepository(),
        contracts: new MockContractRepository(),
        risk: new MockRiskRepository(),
        pmp: new MockPMPRepository(),
        project: new MockProjectRepository(),
        turnover: new MockTurnoverRepository(),
        auth: new MockAuthRepository(),
        audit: new MockAuditRepository(),
        workflow: new MockWorkflowRepository(),
        infra: new MockInfraRepository(),
      };

    case 'sharepoint':
      // TODO: Implement SharePoint adapters in Phase 2
      // return {
      //   leads: new SpLeadRepository(config.sp, config.hubUrl),
      //   ...
      // };
      throw new Error('SharePoint adapters not yet implemented. Use mock mode for development.');

    case 'api':
      // TODO: Implement API adapters (future)
      throw new Error('API adapters not yet implemented.');

    default:
      throw new Error(`Unknown data service mode: ${mode}`);
  }
}
