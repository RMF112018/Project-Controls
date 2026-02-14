import { WorkflowActionType, ActionPriority } from './enums';

export interface IActionInboxItem {
  id: string;
  workflowType: WorkflowActionType;
  actionLabel: string;
  projectCode: string;
  projectName: string;
  entityId: number;
  requestedBy: string;
  requestedByEmail: string;
  requestedDate: string;
  waitingDays: number;
  routePath: string;
  priority: ActionPriority;
}
