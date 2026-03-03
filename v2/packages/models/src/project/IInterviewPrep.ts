export interface IInterviewPrep {
  id: number;
  leadId: number;
  projectCode: string;
  interviewDate?: string;
  interviewLocation?: string;
  panelMembers: string[];
  presentationTheme?: string;
  keyMessages?: string;
  teamAssignments?: string;
  rehearsalDate?: string;
  documents?: string[];
}
