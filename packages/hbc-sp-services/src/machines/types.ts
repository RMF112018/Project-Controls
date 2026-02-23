import type { RoleName, ScorecardStatus } from '../models/enums';
import type { PMPStatus } from '../models/IProjectManagementPlan';
import type { ContractTrackingStatus } from '../models/IContractTrackingApproval';

export type WorkflowMachineType = 'goNoGo' | 'pmpApproval' | 'commitmentApproval';

export interface IWorkflowActorContext {
  userPermissions: string[];
  actorRole: RoleName;
}

export interface IGoNoGoMachineContext extends IWorkflowActorContext {
  scorecardId: number;
  projectCode: string;
  currentStatus: ScorecardStatus;
}

export interface IPmpApprovalMachineContext extends IWorkflowActorContext {
  pmpId: number;
  projectCode: string;
  currentStatus: PMPStatus;
  pendingSteps: number;
  pendingSignatures: number;
}

export interface ICommitmentApprovalMachineContext extends IWorkflowActorContext {
  entryId: number;
  projectCode: string;
  currentStatus: ContractTrackingStatus;
}
