export interface IChecklistCategory {
  name: string;
  items: string[];
}

export type ProjectHubChecklistStatus = 'Complete' | 'In Progress' | 'Not Started';

export interface ProjectHubChecklistItem {
  id: string;
  title: string;
  description: string;
  status: ProjectHubChecklistStatus;
  assignee: string;
  dueDate: string;
  notes?: string;
}

export type ProjectHubKickoffCategory = 'Documents' | 'Team' | 'Scope' | 'Schedule';

export interface ProjectHubKickoffChecklistItem {
  id: string;
  label: string;
  description: string;
  category: ProjectHubKickoffCategory;
  checked: boolean;
}
