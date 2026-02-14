export type CloseoutItemStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface ICloseoutItem {
  id: number;
  projectCode: string;
  category: string;
  description: string;
  status: CloseoutItemStatus;
  assignedTo: string;
  assignedToId?: number;
  completedDate?: string;
  notes?: string;
}
