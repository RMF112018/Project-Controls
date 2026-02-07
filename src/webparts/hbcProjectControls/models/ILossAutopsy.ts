import { IActionItem } from './IActionItem';

export interface ILossAutopsy {
  id: number;
  leadId: number;
  projectCode?: string;
  rootCauseAnalysis?: string;
  lessonsLearned?: string;
  competitiveIntelligence?: string;
  actionItems: IActionItem[];
  meetingNotes?: string;
  completedDate?: string;
  completedBy?: string;
}
