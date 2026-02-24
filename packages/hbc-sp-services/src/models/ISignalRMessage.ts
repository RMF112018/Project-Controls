import { EntityType, WorkflowKey } from './enums';

export interface IEntityChangedMessage {
  type: 'EntityChanged';
  entityType: EntityType;
  entityId: string;
  action: 'created' | 'updated' | 'deleted';
  changedBy: string;
  changedByName?: string;
  projectCode?: string;
  timestamp: string;
  summary?: string;
}

export interface IUserPresenceMessage {
  type: 'UserPresence';
  userEmail: string;
  displayName: string;
  projectCode: string;
  currentPage: string;
  status: 'active' | 'idle' | 'disconnected';
  timestamp: string;
}

export interface IWorkflowAdvancedMessage {
  type: 'WorkflowAdvanced';
  workflowKey: WorkflowKey;
  entityType: EntityType;
  entityId: string;
  fromStatus: string;
  toStatus: string;
  projectCode?: string;
  advancedBy: string;
  timestamp: string;
}

export interface IProvisioningStatusMessage {
  type: 'ProvisioningStatus';
  projectCode: string;
  currentStep: number;
  totalSteps: number;
  stepStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'compensating';
  stepLabel: string;
  progress: number; // 0-100
  error?: string;
  idempotencyToken?: string;
  timestamp: string;
}

export type SignalRMessage = IEntityChangedMessage | IUserPresenceMessage | IWorkflowAdvancedMessage | IProvisioningStatusMessage;

export type SignalRConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type SignalRMessageType = SignalRMessage['type'];
