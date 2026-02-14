import { DeliverableStatus } from './enums';

export interface IDeliverable {
  id: number;
  projectCode: string;
  name: string;
  department: 'Estimating' | 'Marketing' | 'IDS' | 'BD';
  assignedTo: string;
  assignedToId?: number;
  status: DeliverableStatus;
  dueDate: string;
  completedDate?: string;
  notes?: string;
}
