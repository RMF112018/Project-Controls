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

export enum RenderMode {
  Standalone = 'standalone',
  Full = 'full',
  Project = 'project'
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
  PermissionChanged = 'Permission.Changed',
  MeetingScheduled = 'Meeting.Scheduled',
  LossRecorded = 'Loss.Recorded',
  AutopsyCompleted = 'Autopsy.Completed',
  ConfigFeatureFlagChanged = 'Config.FeatureFlagChanged',
  ConfigRoleChanged = 'Config.RoleChanged'
}

export enum EntityType {
  Lead = 'Lead',
  Scorecard = 'Scorecard',
  Estimate = 'Estimate',
  Project = 'Project',
  Permission = 'Permission',
  Config = 'Config'
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
  PreconKickoff = 'PreconKickoff',
  WinStrategy = 'WinStrategy',
  LossAutopsy = 'LossAutopsy',
  Turnover = 'Turnover',
  Other = 'Other'
}

export enum NotificationType {
  Email = 'Email',
  Teams = 'Teams',
  Both = 'Both'
}
