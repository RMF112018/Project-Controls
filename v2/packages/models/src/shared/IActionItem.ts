import { ActionItemStatus } from './enums';

export interface IActionItem {
  id: number;
  projectCode?: string;
  /** FK to parent Loss_Autopsies.id (when action item is part of an autopsy) */
  autopsyId?: number;
  description: string;
  assignee: string;
  assigneeId?: number;
  dueDate: string;
  status: ActionItemStatus;
  completedDate?: string;
}
