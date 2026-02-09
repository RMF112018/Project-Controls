export enum Stage {
  LeadDiscovery = 'Lead-Discovery',
  GoNoGoPending = 'GoNoGo-Pending',
  GoNoGoWait = 'GoNoGo-Wait',
  Opportunity = 'Opportunity',
  Pursuit = 'Pursuit',
  WonContractPending = 'Won-ContractPending',
  ActiveConstruction = 'Active-Construction',
  Closeout = 'Closeout',
  ArchivedNoGo = 'Archived-NoGo',
  ArchivedLoss = 'Archived-Loss',
  ArchivedHistorical = 'Archived-Historical'
}

export enum Region {
  Miami = 'Miami',
  WestPalmBeach = 'West Palm Beach',
  MartinCounty = 'Martin County',
  Orlando = 'Orlando',
  Tallahassee = 'Tallahassee'
}

export enum Sector {
  Airport = 'Airport',
  City = 'City',
  Commercial = 'Commercial',
  County = 'County',
  Federal = 'Federal',
  GolfClubCourse = 'Golf Club/Course',
  MixedUse = 'Mixed-Use',
  MultiFamily = 'Multi-Family',
  Municipal = 'Municipal',
  ParkingGarage = 'Parking Garage',
  State = 'State',
  Warehouse = 'Warehouse'
}

export enum Division {
  Commercial = 'Commercial',
  LuxuryResidential = 'Luxury Residential'
}

export enum DepartmentOfOrigin {
  BusinessDevelopment = 'Business Development',
  Estimating = 'Estimating',
  Marketing = 'Marketing',
  Operations = 'Operations',
  Other = 'Other'
}

export enum DeliveryMethod {
  GMP = 'GMP',
  HardBid = 'Hard-Bid',
  PreconWithGMP = 'Precon w/ GMP Amend',
  Other = 'Other'
}

export enum GoNoGoDecision {
  Go = 'GO',
  NoGo = 'NO GO',
  Wait = 'WAIT'
}

export enum WinLossDecision {
  Win = 'Win',
  Loss = 'Loss'
}

export enum LossReason {
  Price = 'Price',
  Relationship = 'Relationship',
  Experience = 'Experience',
  Schedule = 'Schedule',
  Competition = 'Competition',
  Other = 'Other'
}

export enum RoleName {
  BDRepresentative = 'BD Representative',
  EstimatingCoordinator = 'Estimating Coordinator',
  AccountingManager = 'Accounting Manager',
  PreconstructionTeam = 'Preconstruction Team',
  OperationsTeam = 'Operations Team',
  ExecutiveLeadership = 'Executive Leadership',
  Legal = 'Legal',
  RiskManagement = 'Risk Management',
  Marketing = 'Marketing',
  QualityControl = 'Quality Control',
  Safety = 'Safety',
  IDS = 'IDS'
}

export enum ProvisioningStatus {
  Queued = 'Queued',
  InProgress = 'InProgress',
  Completed = 'Completed',
  PartialFailure = 'PartialFailure',
  Failed = 'Failed'
}

export enum AuditAction {
  LeadCreated = 'Lead.Created',
  LeadEdited = 'Lead.Edited',
  GoNoGoScoreSubmitted = 'GoNoGo.ScoreSubmitted',
  GoNoGoDecisionMade = 'GoNoGo.DecisionMade',
  SiteProvisioningTriggered = 'Site.ProvisioningTriggered',
  SiteProvisioningCompleted = 'Site.ProvisioningCompleted',
  EstimateCreated = 'Estimate.Created',
  EstimateStatusChanged = 'Estimate.StatusChanged',
  TurnoverInitiated = 'Turnover.Initiated',
  TurnoverCompleted = 'Turnover.Completed',
  PermissionChanged = 'Permission.Changed',
  MeetingScheduled = 'Meeting.Scheduled',
  LossRecorded = 'Loss.Recorded',
  AutopsyCompleted = 'Autopsy.Completed',
  ConfigFeatureFlagChanged = 'Config.FeatureFlagChanged',
  ConfigRoleChanged = 'Config.RoleChanged',
  ChecklistItemUpdated = 'Checklist.ItemUpdated',
  ChecklistItemAdded = 'Checklist.ItemAdded',
  ChecklistSignedOff = 'Checklist.SignedOff',
  MatrixAssignmentChanged = 'Matrix.AssignmentChanged',
  MatrixTaskAdded = 'Matrix.TaskAdded',
  ProjectRecordUpdated = 'ProjectRecord.Updated',
  ProjectRecordCreated = 'ProjectRecord.Created',
  PMPSubmitted = 'PMP.Submitted',
  PMPApproved = 'PMP.Approved',
  PMPReturned = 'PMP.Returned',
  PMPSigned = 'PMP.Signed',
  RiskItemUpdated = 'Risk.ItemUpdated',
  QualityConcernUpdated = 'Quality.ConcernUpdated',
  SafetyConcernUpdated = 'Safety.ConcernUpdated',
  ScheduleUpdated = 'Schedule.Updated',
  SuperPlanUpdated = 'SuperPlan.Updated',
  LessonAdded = 'Lesson.Added',
  MonthlyReviewSubmitted = 'MonthlyReview.Submitted',
  MonthlyReviewAdvanced = 'MonthlyReview.Advanced',
  WorkflowStepUpdated = 'Workflow.StepUpdated',
  WorkflowConditionAdded = 'Workflow.ConditionAdded',
  WorkflowConditionRemoved = 'Workflow.ConditionRemoved',
  WorkflowOverrideSet = 'Workflow.OverrideSet',
  WorkflowOverrideRemoved = 'Workflow.OverrideRemoved',
  TurnoverAgendaCreated = 'Turnover.AgendaCreated',
  TurnoverPrerequisiteCompleted = 'Turnover.PrerequisiteCompleted',
  TurnoverItemDiscussed = 'Turnover.ItemDiscussed',
  TurnoverSubcontractorAdded = 'Turnover.SubcontractorAdded',
  TurnoverSubcontractorRemoved = 'Turnover.SubcontractorRemoved',
  TurnoverExhibitReviewed = 'Turnover.ExhibitReviewed',
  TurnoverExhibitAdded = 'Turnover.ExhibitAdded',
  TurnoverExhibitRemoved = 'Turnover.ExhibitRemoved',
  TurnoverSigned = 'Turnover.Signed',
  TurnoverAgendaCompleted = 'Turnover.AgendaCompleted',
  HubNavLinkCreated = 'HubNav.LinkCreated',
  HubNavLinkFailed = 'HubNav.LinkFailed',
  HubNavLinkRetried = 'HubNav.LinkRetried',
  HubNavLinkRemoved = 'HubNav.LinkRemoved',
  HubSiteUrlUpdated = 'HubNav.SiteUrlUpdated'
}

export enum EntityType {
  Lead = 'Lead',
  Scorecard = 'Scorecard',
  Estimate = 'Estimate',
  Project = 'Project',
  Permission = 'Permission',
  Config = 'Config',
  Checklist = 'Checklist',
  Matrix = 'Matrix',
  ProjectRecord = 'ProjectRecord',
  RiskCost = 'RiskCost',
  Quality = 'Quality',
  Safety = 'Safety',
  Schedule = 'Schedule',
  SuperintendentPlan = 'SuperintendentPlan',
  LessonLearned = 'LessonLearned',
  PMP = 'PMP',
  MonthlyReview = 'MonthlyReview',
  WorkflowDefinition = 'WorkflowDefinition',
  TurnoverAgenda = 'TurnoverAgenda'
}

export enum DeliverableStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  InReview = 'In Review',
  Complete = 'Complete'
}

export enum ActionItemStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Complete = 'Complete'
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum TurnoverCategory {
  Documents = 'Documents',
  Safety = 'Safety',
  Financial = 'Financial',
  Scheduling = 'Scheduling',
  Staffing = 'Staffing',
  Subcontracts = 'Subcontracts'
}

export enum AwardStatus {
  Pending = 'Pending',
  AwardedWithPrecon = 'Awarded w/ Precon',
  AwardedWithoutPrecon = 'Awarded w/o Precon',
  NotAwarded = 'Not Awarded'
}

export enum EstimateSource {
  ClientRequest = 'Client Request',
  RFP = 'RFP',
  RFQ = 'RFQ',
  Referral = 'Referral',
  Other = 'Other'
}

export enum DeliverableType {
  GMP = 'GMP',
  ConceptualEst = 'Conceptual Est',
  LumpSumProposal = 'Lump Sum Proposal',
  Schematic = 'Schematic',
  DDEst = 'DD Est',
  ROM = 'ROM',
  RFP = 'RFP',
  HardBid = 'Hard Bid',
  Other = 'Other'
}

export enum MeetingType {
  GoNoGo = 'GoNoGo',
  Kickoff = 'Kickoff',
  PreconKickoff = 'PreconKickoff',
  RedTeam = 'RedTeam',
  WinStrategy = 'WinStrategy',
  Autopsy = 'Autopsy',
  LossAutopsy = 'LossAutopsy',
  Turnover = 'Turnover',
  Other = 'Other'
}

export enum NotificationType {
  Email = 'Email',
  Teams = 'Teams',
  Both = 'Both'
}

export enum ActiveProjectStatus {
  Precon = 'Precon',
  Construction = 'Construction',
  FinalPayment = 'Final Payment'
}

export enum NotificationEvent {
  LeadSubmitted = 'LeadSubmitted',
  GoNoGoScoringRequested = 'GoNoGoScoringRequested',
  GoNoGoDecisionMade = 'GoNoGoDecisionMade',
  SiteProvisioned = 'SiteProvisioned',
  PreconKickoff = 'PreconKickoff',
  DeliverableDueApproaching = 'DeliverableDueApproaching',
  WinLossRecorded = 'WinLossRecorded',
  AutopsyScheduled = 'AutopsyScheduled',
  TurnoverCompleted = 'TurnoverCompleted',
  SafetyFolderChanged = 'SafetyFolderChanged',
  PMPSignatureRequested = 'PMPSignatureRequested',
  PMPSubmittedForApproval = 'PMPSubmittedForApproval',
  PMPApprovalRequired = 'PMPApprovalRequired',
  PMPApproved = 'PMPApproved',
  PMPReturnedForRevision = 'PMPReturnedForRevision',
  MonthlyReviewDueNotification = 'MonthlyReviewDueNotification',
  MonthlyReviewSubmittedToPX = 'MonthlyReviewSubmittedToPX',
  MonthlyReviewReturnedToPM = 'MonthlyReviewReturnedToPM',
  MonthlyReviewSubmittedToLeadership = 'MonthlyReviewSubmittedToLeadership',
  JobNumberRequested = 'JobNumberRequested',
  JobNumberAssigned = 'JobNumberAssigned',
  EstimatingKickoffScheduled = 'EstimatingKickoffScheduled',
  AutopsyFinalized = 'AutopsyFinalized',
  CommitmentSubmitted = 'CommitmentSubmitted',
  CommitmentWaiverRequired = 'CommitmentWaiverRequired',
  CommitmentApproved = 'CommitmentApproved',
  CommitmentEscalatedToCFO = 'CommitmentEscalatedToCFO',
  CommitmentRejected = 'CommitmentRejected'
}

export enum TurnoverStatus {
  Draft = 'Draft',
  PrerequisitesInProgress = 'PrerequisitesInProgress',
  MeetingScheduled = 'MeetingScheduled',
  MeetingComplete = 'MeetingComplete',
  PendingSignatures = 'PendingSignatures',
  Signed = 'Signed',
  Complete = 'Complete'
}

export enum WorkflowKey {
  GO_NO_GO = 'GO_NO_GO',
  PMP_APPROVAL = 'PMP_APPROVAL',
  MONTHLY_REVIEW = 'MONTHLY_REVIEW',
  COMMITMENT_APPROVAL = 'COMMITMENT_APPROVAL',
  TURNOVER_APPROVAL = 'TURNOVER_APPROVAL'
}

export enum StepAssignmentType {
  ProjectRole = 'ProjectRole',
  NamedPerson = 'NamedPerson'
}

export enum ConditionField {
  Division = 'Division',
  Region = 'Region',
  Sector = 'Sector'
}
