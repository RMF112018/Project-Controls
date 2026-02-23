export enum JobNumberRequestStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Draft = 'Draft',
  Submitted = 'Submitted',
  PendingController = 'PendingController',
  PendingProvisioning = 'PendingProvisioning',
}

export interface IJobNumberRequest {
  id: number;
  LeadID: number;
  RequestDate: string;
  Originator: string;
  RequiredByDate: string;
  ProjectAddress: string;
  /** @denormalized — source: Leads_Master.ProjectExecutive */
  ProjectExecutive: string;
  /** @denormalized — source: Leads_Master.ProjectManager */
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

  // ── Phase 4E: Project Number Request Form Fields ───────────────────
  /** Pre-filled with current user email */
  Email?: string;
  /** Project name from request form */
  ProjectName?: string;
  /** Street address from request form */
  StreetAddress?: string;
  /** City, State from request form */
  CityState?: string;
  /** Zip code from request form */
  ZipCode?: string;
  /** County from request form */
  County?: string;
  /** Office & Division code (e.g., '01-43') */
  OfficeDivision?: string;
  /** Office & Division display label (e.g., 'HB HQ General Commercial (01-43)') */
  OfficeDivisionLabel?: string;
  /** Will this project be managed in Procore? */
  ManagedInProcore?: boolean;
  /** Additional SAGE access recipients */
  AdditionalSageAccess?: string;
  /** Who will approve Timberscan invoices/pay apps? */
  TimberscanApprover?: string;

  // ── Phase 4E: Workflow State Fields ────────────────────────────────
  /** Which submit button was used: 'typical' or 'alternate' */
  WorkflowType?: 'typical' | 'alternate';
  /** Display name of person whose action is currently pending */
  BallInCourt?: string;
  /** Display name of user who submitted the request */
  SubmittedBy?: string;
  /** ISO timestamp when provisioning was triggered */
  ProvisioningTriggeredAt?: string;
  /** URL of provisioned SharePoint site */
  SiteUrl?: string;
}
