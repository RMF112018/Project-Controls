/**
 * SignalR message types shared between Azure Functions and SPFx client.
 * Keep in sync with packages/hbc-sp-services/src/models/ISignalRMessage.ts
 */

export interface IEntityChangedMessage {
  type: 'EntityChanged';
  entityType: string;
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
  workflowKey: string;
  entityType: string;
  entityId: string;
  fromStatus: string;
  toStatus: string;
  projectCode?: string;
  advancedBy: string;
  timestamp: string;
}

export type SignalRMessage = IEntityChangedMessage | IUserPresenceMessage | IWorkflowAdvancedMessage;

export interface IJoinLeaveRequest {
  groupName: string;
  action: 'join' | 'leave';
}

export interface IBroadcastRequest {
  message: SignalRMessage;
  targetGroups?: string[];
}
