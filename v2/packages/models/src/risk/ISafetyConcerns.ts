export type SafetyConcernSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type SafetyConcernStatus = 'Open' | 'Monitoring' | 'Resolved' | 'Closed';

export interface ISafetyConcern {
  id: number;
  projectCode: string;
  safetyOfficerName: string;
  safetyOfficerEmail: string;
  letter: string;
  description: string;
  severity: SafetyConcernSeverity;
  raisedBy: string;
  raisedDate: string;
  status: SafetyConcernStatus;
  resolution: string;
  resolvedDate: string | null;
  notes: string;
}
