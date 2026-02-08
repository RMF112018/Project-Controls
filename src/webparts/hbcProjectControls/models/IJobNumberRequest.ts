export enum JobNumberRequestStatus {
  Pending = 'Pending',
  Completed = 'Completed'
}

export interface IJobNumberRequest {
  id: number;
  LeadID: number;
  RequestDate: string;
  Originator: string;
  RequiredByDate: string;
  ProjectAddress: string;
  ProjectExecutive: string;
  ProjectManager?: string;
  ProjectType: string;
  ProjectTypeLabel: string;
  IsEstimatingOnly: boolean;
  RequestedCostCodes: string[];
  RequestStatus: JobNumberRequestStatus;
  AssignedJobNumber?: string;
  AssignedBy?: string;
  AssignedDate?: string;
  SiteProvisioningHeld: boolean;
  TempProjectCode?: string;
  Notes?: string;
}
