export type QualityConcernStatus = 'Open' | 'Monitoring' | 'Resolved' | 'Closed';

export interface IQualityConcern {
  id: number;
  projectCode: string;
  letter: string;
  description: string;
  raisedBy: string;
  raisedDate: string;
  status: QualityConcernStatus;
  resolution: string;
  resolvedDate: string | null;
  notes: string;
}
