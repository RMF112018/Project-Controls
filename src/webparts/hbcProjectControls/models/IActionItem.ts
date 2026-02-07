import { ActionItemStatus } from './enums';

export interface IActionItem {
  id: number;
  projectCode?: string;
  description: string;
  assignee: string;
  assigneeId?: number;
  dueDate: string;
  status: ActionItemStatus;
  completedDate?: string;
}
