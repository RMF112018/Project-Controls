import { TurnoverCategory } from './enums';

export type TurnoverItemStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface ITurnoverItem {
  id: number;
  projectCode: string;
  category: TurnoverCategory;
  description: string;
  status: TurnoverItemStatus;
  assignedTo: string;
  assignedToId?: number;
  required: boolean;
  completedDate?: string;
  notes?: string;
}
