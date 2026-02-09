/**
 * SharePoint column mappings for all lists.
 * Maps TypeScript interface field names to SharePoint internal column names.
 * Comments indicate SP column type.
 *
 * Naming conventions:
 *   - SP auto-generated ID columns are mapped as 'ID'
 *   - Person columns use the SP internal name (e.g., 'AuthorId' for lookup IDs)
 *   - Multi-value fields stored as JSON use Multiple Lines of Text
 *   - Child-list relationships are noted with the child list name
 */

// ════════════════════════════════════════════════════════════════════════════
// ──── Hub-Level Lists ────
// ════════════════════════════════════════════════════════════════════════════

/**
 * List: Leads_Master
 * Interface: ILead
 */
export const LEADS_MASTER_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (default)
  ClientName: 'ClientName',                    // SP: Single Line of Text
  AE: 'AE',                                   // SP: Single Line of Text
  CityLocation: 'CityLocation',               // SP: Single Line of Text
  Region: 'Region',                            // SP: Choice
  Sector: 'Sector',                            // SP: Choice
  SubSector: 'SubSector',                      // SP: Single Line of Text
  Division: 'Division',                        // SP: Choice
  Originator: 'Originator',                    // SP: Single Line of Text
  OriginatorId: 'OriginatorId',                // SP: Number (Person lookup ID)
  DepartmentOfOrigin: 'DepartmentOfOrigin',    // SP: Choice
  DateOfEvaluation: 'DateOfEvaluation',        // SP: DateTime
  PreconDurationMonths: 'PreconDurationMonths',// SP: Number
  SquareFeet: 'SquareFeet',                    // SP: Number
  ProjectStartDate: 'ProjectStartDate',        // SP: DateTime
  ProjectDurationMonths: 'ProjectDurationMonths', // SP: Single Line of Text
  EstimatedPursuitCost: 'EstimatedPursuitCost',   // SP: Currency
  EstimatedPreconBudget: 'EstimatedPreconBudget', // SP: Currency
  ProjectValue: 'ProjectValue',                // SP: Currency
  DeliveryMethod: 'DeliveryMethod',            // SP: Choice
  AnticipatedFeePct: 'AnticipatedFeePct',      // SP: Number
  AnticipatedGrossMargin: 'AnticipatedGrossMargin', // SP: Currency
  ProposalBidDue: 'ProposalBidDue',            // SP: DateTime
  AwardDate: 'AwardDate',                      // SP: DateTime
  Stage: 'Stage',                              // SP: Choice
  ProjectCode: 'ProjectCode',                  // SP: Single Line of Text
  ProjectSiteURL: 'ProjectSiteURL',            // SP: Hyperlink
  GoNoGoScore_Originator: 'GoNoGoScore_Originator', // SP: Number
  GoNoGoScore_Committee: 'GoNoGoScore_Committee',   // SP: Number
  GoNoGoDecision: 'GoNoGoDecision',            // SP: Choice
  GoNoGoDecisionDate: 'GoNoGoDecisionDate',    // SP: DateTime
  WinLossDecision: 'WinLossDecision',          // SP: Choice
  WinLossDate: 'WinLossDate',                  // SP: DateTime
  LossReason: 'LossReason',                   // SP: Choice (multi-select)
  LossCompetitor: 'LossCompetitor',            // SP: Single Line of Text
  LossAutopsyNotes: 'LossAutopsyNotes',        // SP: Multiple Lines of Text
  ProjectAddress: 'ProjectAddress',            // SP: Single Line of Text
  ProjectExecutive: 'ProjectExecutive',        // SP: Single Line of Text
  ProjectManager: 'ProjectManager',            // SP: Single Line of Text
  OfficialJobNumber: 'OfficialJobNumber',      // SP: Single Line of Text
  JobNumberRequestId: 'JobNumberRequestId',    // SP: Number (lookup ID)
} as const;

/**
 * List: App_Roles
 * Interface: IRole
 */
export const APP_ROLES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (RoleName enum value)
  UserOrGroup: 'UserOrGroup',                  // SP: Person or Group (multi-value)
  UserOrGroupIds: 'UserOrGroupIds',            // SP: Number (multi-value Person lookup IDs; virtual)
  Permissions: 'Permissions',                  // SP: Multiple Lines of Text (JSON array)
  IsActive: 'IsActive',                        // SP: Yes/No
} as const;

/**
 * List: Feature_Flags
 * Interface: IFeatureFlag
 */
export const FEATURE_FLAGS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  FeatureName: 'FeatureName',                  // SP: Single Line of Text
  Enabled: 'Enabled',                          // SP: Yes/No
  EnabledForRoles: 'EnabledForRoles',          // SP: Multiple Lines of Text (JSON array of RoleName)
  TargetDate: 'TargetDate',                    // SP: DateTime
  Notes: 'Notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: App_Context_Config
 * Shape: { SiteURL, RenderMode, AppTitle, ShowNavigation, VisibleModules }
 * No dedicated interface; uses inline type in IDataService
 */
export const APP_CONTEXT_CONFIG_COLUMNS = {
  SiteURL: 'SiteURL',                          // SP: Single Line of Text
  RenderMode: 'RenderMode',                    // SP: Choice
  AppTitle: 'AppTitle',                        // SP: Single Line of Text
  ShowNavigation: 'ShowNavigation',            // SP: Single Line of Text
  VisibleModules: 'VisibleModules',            // SP: Multiple Lines of Text (JSON array)
} as const;

/**
 * List: Audit_Log
 * Interface: IAuditEntry
 */
export const AUDIT_LOG_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Timestamp: 'Timestamp',                      // SP: DateTime
  User: 'User',                                // SP: Single Line of Text
  UserId: 'UserId',                            // SP: Number (Person lookup ID)
  Action: 'Action',                            // SP: Single Line of Text
  EntityType: 'EntityType',                    // SP: Single Line of Text
  EntityId: 'EntityId',                        // SP: Single Line of Text
  ProjectCode: 'ProjectCode',                  // SP: Single Line of Text
  FieldChanged: 'FieldChanged',                // SP: Single Line of Text
  PreviousValue: 'PreviousValue',              // SP: Multiple Lines of Text
  NewValue: 'NewValue',                        // SP: Multiple Lines of Text
  Details: 'Details',                          // SP: Multiple Lines of Text
} as const;

/**
 * List: Audit_Log_Archive
 * Interface: IAuditEntry (same shape as Audit_Log)
 */
export const AUDIT_LOG_ARCHIVE_COLUMNS = {
  ...AUDIT_LOG_COLUMNS,
} as const;

/**
 * List: Provisioning_Log
 * Interface: IProvisioningLog
 */
export const PROVISIONING_LOG_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  projectName: 'projectName',                  // SP: Single Line of Text (denormalized from Leads_Master.Title)
  leadId: 'leadId',                            // SP: Number (lookup ID)
  status: 'status',                            // SP: Choice (ProvisioningStatus enum)
  currentStep: 'currentStep',                  // SP: Number
  completedSteps: 'completedSteps',            // SP: Number
  failedStep: 'failedStep',                    // SP: Number
  errorMessage: 'errorMessage',                // SP: Multiple Lines of Text
  retryCount: 'retryCount',                    // SP: Number
  siteUrl: 'siteUrl',                          // SP: Hyperlink
  requestedBy: 'requestedBy',                  // SP: Single Line of Text
  requestedAt: 'requestedAt',                  // SP: DateTime
  completedAt: 'completedAt',                  // SP: DateTime
} as const;

/**
 * List: Estimating_Tracker
 * Interface: IEstimatingTracker
 */
export const ESTIMATING_TRACKER_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (denormalized from Leads_Master.Title)
  LeadID: 'LeadID',                            // SP: Number (lookup ID)
  ProjectCode: 'ProjectCode',                  // SP: Single Line of Text
  Source: 'Source',                             // SP: Choice (EstimateSource enum)
  DeliverableType: 'DeliverableType',          // SP: Choice (DeliverableType enum)
  SubBidsDue: 'SubBidsDue',                    // SP: DateTime
  PreSubmissionReview: 'PreSubmissionReview',   // SP: DateTime
  WinStrategyMeeting: 'WinStrategyMeeting',    // SP: DateTime
  DueDate_OutTheDoor: 'DueDate_OutTheDoor',    // SP: DateTime
  LeadEstimator: 'LeadEstimator',              // SP: Single Line of Text
  LeadEstimatorId: 'LeadEstimatorId',          // SP: Number (Person lookup ID)
  Contributors: 'Contributors',                // SP: Person or Group (multi-value)
  ContributorIds: 'ContributorIds',            // SP: Number (multi-value Person lookup IDs; virtual)
  PX_ProjectExecutive: 'PX_ProjectExecutive',  // SP: Single Line of Text
  PX_ProjectExecutiveId: 'PX_ProjectExecutiveId', // SP: Number (Person lookup ID)
  Chk_BidBond: 'Chk_BidBond',                 // SP: Yes/No
  Chk_PPBond: 'Chk_PPBond',                   // SP: Yes/No
  Chk_Schedule: 'Chk_Schedule',               // SP: Yes/No
  Chk_Logistics: 'Chk_Logistics',             // SP: Yes/No
  Chk_BIMProposal: 'Chk_BIMProposal',         // SP: Yes/No
  Chk_PreconProposal: 'Chk_PreconProposal',   // SP: Yes/No
  Chk_ProposalTabs: 'Chk_ProposalTabs',       // SP: Yes/No
  Chk_CoordMarketing: 'Chk_CoordMarketing',   // SP: Yes/No
  Chk_BusinessTerms: 'Chk_BusinessTerms',     // SP: Yes/No
  DocSetStage: 'DocSetStage',                  // SP: Single Line of Text
  PreconFee: 'PreconFee',                      // SP: Currency
  FeePaidToDate: 'FeePaidToDate',              // SP: Currency
  DesignBudget: 'DesignBudget',                // SP: Currency
  EstimateType: 'EstimateType',                // SP: Choice (DeliverableType enum)
  EstimatedCostValue: 'EstimatedCostValue',    // SP: Currency
  CostPerGSF: 'CostPerGSF',                   // SP: Number
  CostPerUnit: 'CostPerUnit',                  // SP: Number
  SubmittedDate: 'SubmittedDate',              // SP: DateTime
  AwardStatus: 'AwardStatus',                  // SP: Choice (AwardStatus enum)
  NotesFeedback: 'NotesFeedback',              // SP: Multiple Lines of Text
} as const;

/**
 * List: GoNoGo_Scorecard
 * Interface: IGoNoGoScorecard
 * Note: 'scores' object is flattened into SP columns per criterion
 */
export const GONOGO_SCORECARD_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  LeadID: 'LeadID',                            // SP: Number (lookup ID)
  ProjectCode: 'ProjectCode',                  // SP: Single Line of Text
  scores: 'scores',                            // SP: Multiple Lines of Text (JSON — {criterionId: {originator, committee}})
  TotalScore_Orig: 'TotalScore_Orig',          // SP: Number
  TotalScore_Cmte: 'TotalScore_Cmte',          // SP: Number
  OriginatorComments: 'OriginatorComments',    // SP: Multiple Lines of Text
  CommitteeComments: 'CommitteeComments',      // SP: Multiple Lines of Text
  ProposalMarketingComments: 'ProposalMarketingComments', // SP: Multiple Lines of Text
  ProposalMarketingResources: 'ProposalMarketingResources', // SP: Multiple Lines of Text
  ProposalMarketingHours: 'ProposalMarketingHours',       // SP: Number
  EstimatingComments: 'EstimatingComments',    // SP: Multiple Lines of Text
  EstimatingResources: 'EstimatingResources',  // SP: Multiple Lines of Text
  EstimatingHours: 'EstimatingHours',          // SP: Number
  DecisionMakingProcess: 'DecisionMakingProcess', // SP: Multiple Lines of Text
  HBDifferentiators: 'HBDifferentiators',      // SP: Multiple Lines of Text
  WinStrategy: 'WinStrategy',                  // SP: Multiple Lines of Text
  StrategicPursuit: 'StrategicPursuit',        // SP: Multiple Lines of Text
  DecisionMakerAdvocate: 'DecisionMakerAdvocate', // SP: Multiple Lines of Text
  Decision: 'Decision',                        // SP: Choice (GoNoGoDecision enum)
  DecisionDate: 'DecisionDate',                // SP: DateTime
  ScoredBy_Orig: 'ScoredBy_Orig',              // SP: Single Line of Text
  ScoredBy_Cmte: 'ScoredBy_Cmte',              // SP: Multiple Lines of Text (JSON array)
} as const;

/**
 * List: GNG_Committee
 * No dedicated interface; lookup list for Go/No-Go committee members
 */
export const GNG_COMMITTEE_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (member display name)
  Email: 'Email',                              // SP: Single Line of Text
  Role: 'Role',                                // SP: Single Line of Text
  IsActive: 'IsActive',                        // SP: Yes/No
} as const;

/**
 * List: Active_Projects_Portfolio
 * Interface: IActiveProject
 * Note: personnel, financials, schedule, riskMetrics are nested objects stored as flat SP columns
 */
export const ACTIVE_PROJECTS_PORTFOLIO_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  jobNumber: 'jobNumber',                      // SP: Single Line of Text
  projectCode: 'projectCode',                  // SP: Single Line of Text
  projectName: 'projectName',                  // SP: Single Line of Text

  // Personnel (IProjectPersonnel — stored as flat columns)
  'personnel.projectExecutive': 'personnelProjectExecutive',         // SP: Single Line of Text
  'personnel.projectExecutiveEmail': 'personnelProjectExecutiveEmail', // SP: Single Line of Text
  'personnel.leadPM': 'personnelLeadPM',                             // SP: Single Line of Text
  'personnel.leadPMEmail': 'personnelLeadPMEmail',                   // SP: Single Line of Text
  'personnel.additionalPM': 'personnelAdditionalPM',                 // SP: Single Line of Text
  'personnel.assistantPM': 'personnelAssistantPM',                   // SP: Single Line of Text
  'personnel.projectAccountant': 'personnelProjectAccountant',       // SP: Single Line of Text
  'personnel.projectAssistant': 'personnelProjectAssistant',         // SP: Single Line of Text
  'personnel.leadSuper': 'personnelLeadSuper',                       // SP: Single Line of Text
  'personnel.superintendent': 'personnelSuperintendent',             // SP: Single Line of Text
  'personnel.assistantSuper': 'personnelAssistantSuper',             // SP: Single Line of Text

  status: 'status',                            // SP: Choice (ProjectStatus)
  sector: 'sector',                            // SP: Choice (SectorType)
  region: 'region',                            // SP: Single Line of Text

  // Financials (IProjectFinancials — stored as flat columns)
  'financials.originalContract': 'financialsOriginalContract',       // SP: Currency
  'financials.changeOrders': 'financialsChangeOrders',               // SP: Currency
  'financials.currentContractValue': 'financialsCurrentContractValue', // SP: Currency
  'financials.billingsToDate': 'financialsBillingsToDate',           // SP: Currency
  'financials.unbilled': 'financialsUnbilled',                       // SP: Currency
  'financials.projectedFee': 'financialsProjectedFee',               // SP: Currency
  'financials.projectedFeePct': 'financialsProjectedFeePct',         // SP: Number
  'financials.projectedCost': 'financialsProjectedCost',             // SP: Currency
  'financials.remainingValue': 'financialsRemainingValue',           // SP: Currency

  // Schedule (IProjectSchedule — stored as flat columns)
  'schedule.startDate': 'scheduleStartDate',                         // SP: DateTime
  'schedule.substantialCompletionDate': 'scheduleSubstantialCompletionDate', // SP: DateTime
  'schedule.nocExpiration': 'scheduleNocExpiration',                  // SP: DateTime
  'schedule.currentPhase': 'scheduleCurrentPhase',                   // SP: Single Line of Text
  'schedule.percentComplete': 'schedulePercentComplete',             // SP: Number

  // Risk Metrics (IProjectRiskMetrics — stored as flat columns)
  'riskMetrics.averageQScore': 'riskMetricsAverageQScore',           // SP: Number
  'riskMetrics.openWaiverCount': 'riskMetricsOpenWaiverCount',       // SP: Number
  'riskMetrics.pendingCommitments': 'riskMetricsPendingCommitments', // SP: Number
  'riskMetrics.complianceStatus': 'riskMetricsComplianceStatus',     // SP: Choice

  // Status/Comments
  statusComments: 'statusComments',            // SP: Multiple Lines of Text

  // Metadata
  projectSiteUrl: 'projectSiteUrl',            // SP: Hyperlink
  lastSyncDate: 'lastSyncDate',                // SP: DateTime
  lastModified: 'lastModified',                // SP: DateTime

  // Alert Flags
  hasUnbilledAlert: 'hasUnbilledAlert',        // SP: Yes/No
  hasScheduleAlert: 'hasScheduleAlert',        // SP: Yes/No
  hasFeeErosionAlert: 'hasFeeErosionAlert',    // SP: Yes/No
} as const;

/**
 * List: Template_Registry
 * No dedicated interface; used by ProvisioningService
 */
export const TEMPLATE_REGISTRY_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  TemplateName: 'TemplateName',                // SP: Single Line of Text
  SourceURL: 'SourceURL',                      // SP: Hyperlink
  TargetFolder: 'TargetFolder',                // SP: Single Line of Text
  Division: 'Division',                        // SP: Choice
  Active: 'Active',                            // SP: Yes/No
} as const;

/**
 * List: Regions
 * Simple lookup list; returns string[] via getRegions()
 */
export const REGIONS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (region name)
} as const;

/**
 * List: Sectors
 * Simple lookup list; returns string[] via getSectors()
 */
export const SECTORS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (sector name)
} as const;

/**
 * List: Autopsy_Attendees
 * No dedicated interface; lookup list for Loss Autopsy attendee tracking
 */
export const AUTOPSY_ATTENDEES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text (attendee name)
  Email: 'Email',                              // SP: Single Line of Text
  Role: 'Role',                                // SP: Single Line of Text
  IsActive: 'IsActive',                        // SP: Yes/No
} as const;

/**
 * List: Job_Number_Requests
 * Interface: IJobNumberRequest
 */
export const JOB_NUMBER_REQUESTS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  LeadID: 'LeadID',                            // SP: Number (lookup ID)
  RequestDate: 'RequestDate',                  // SP: DateTime
  Originator: 'Originator',                    // SP: Single Line of Text
  RequiredByDate: 'RequiredByDate',            // SP: DateTime
  ProjectAddress: 'ProjectAddress',            // SP: Single Line of Text
  ProjectExecutive: 'ProjectExecutive',        // SP: Single Line of Text (denormalized)
  ProjectManager: 'ProjectManager',            // SP: Single Line of Text (denormalized)
  ProjectType: 'ProjectType',                  // SP: Single Line of Text
  ProjectTypeLabel: 'ProjectTypeLabel',        // SP: Single Line of Text
  IsEstimatingOnly: 'IsEstimatingOnly',        // SP: Yes/No
  RequestedCostCodes: 'RequestedCostCodes',    // SP: Multiple Lines of Text (JSON array)
  RequestStatus: 'RequestStatus',              // SP: Choice
  AssignedJobNumber: 'AssignedJobNumber',       // SP: Single Line of Text
  AssignedBy: 'AssignedBy',                    // SP: Single Line of Text
  AssignedDate: 'AssignedDate',                // SP: DateTime
  SiteProvisioningHeld: 'SiteProvisioningHeld', // SP: Yes/No
  TempProjectCode: 'TempProjectCode',          // SP: Single Line of Text
  Notes: 'Notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Estimating_Kickoffs
 * Interface: IEstimatingKickoff
 * Note: items[] stored in child list Estimating_Kickoff_Items
 */
export const ESTIMATING_KICKOFFS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  LeadID: 'LeadID',                            // SP: Number (lookup ID)
  ProjectCode: 'ProjectCode',                  // SP: Single Line of Text
  Architect: 'Architect',                      // SP: Single Line of Text
  ProposalDueDateTime: 'ProposalDueDateTime',  // SP: DateTime
  ProposalType: 'ProposalType',                // SP: Single Line of Text
  RFIFormat: 'RFIFormat',                      // SP: Choice
  PrimaryOwnerContact: 'PrimaryOwnerContact',  // SP: Single Line of Text
  ProposalDeliveryMethod: 'ProposalDeliveryMethod', // SP: Single Line of Text
  CopiesIfHandDelivered: 'CopiesIfHandDelivered',   // SP: Number
  HBProposalDue: 'HBProposalDue',              // SP: DateTime
  SubcontractorProposalsDue: 'SubcontractorProposalsDue', // SP: DateTime
  PreSubmissionReview: 'PreSubmissionReview',   // SP: DateTime
  SubcontractorSiteWalkThru: 'SubcontractorSiteWalkThru', // SP: DateTime
  OwnerEstimateReview: 'OwnerEstimateReview',  // SP: DateTime
  // items: stored in child list → Estimating_Kickoff_Items
  KickoffMeetingId: 'KickoffMeetingId',        // SP: Single Line of Text
  KickoffMeetingDate: 'KickoffMeetingDate',    // SP: DateTime
  CreatedBy: 'CreatedBy',                      // SP: Single Line of Text
  CreatedDate: 'CreatedDate',                  // SP: DateTime
  ModifiedBy: 'ModifiedBy',                    // SP: Single Line of Text
  ModifiedDate: 'ModifiedDate',                // SP: DateTime
} as const;

/**
 * List: Estimating_Kickoff_Items
 * Interface: IEstimatingKickoffItem
 * Child list of Estimating_Kickoffs
 */
export const ESTIMATING_KICKOFF_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  kickoffId: 'kickoffId',                      // SP: Number (FK to Estimating_Kickoffs.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  section: 'section',                          // SP: Choice (EstimatingKickoffSection)
  task: 'task',                                // SP: Single Line of Text
  status: 'status',                            // SP: Choice
  responsibleParty: 'responsibleParty',        // SP: Single Line of Text
  deadline: 'deadline',                        // SP: DateTime
  frequency: 'frequency',                      // SP: Single Line of Text
  notes: 'notes',                              // SP: Multiple Lines of Text
  tabRequired: 'tabRequired',                  // SP: Yes/No
  isCustom: 'isCustom',                        // SP: Yes/No
  sortOrder: 'sortOrder',                      // SP: Number
} as const;

/**
 * List: Loss_Autopsies
 * Interface: ILossAutopsy
 * Note: actionItems[] stored in child list Action_Items (with autopsyId FK)
 */
export const LOSS_AUTOPSIES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  leadId: 'leadId',                            // SP: Number (lookup ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  rootCauseAnalysis: 'rootCauseAnalysis',      // SP: Multiple Lines of Text
  lessonsLearned: 'lessonsLearned',            // SP: Multiple Lines of Text
  competitiveIntelligence: 'competitiveIntelligence', // SP: Multiple Lines of Text
  // actionItems: stored in child list → Action_Items (with autopsyId FK)
  meetingNotes: 'meetingNotes',                // SP: Multiple Lines of Text
  completedDate: 'completedDate',              // SP: DateTime
  completedBy: 'completedBy',                  // SP: Single Line of Text

  // Estimating Process Questions (11 Yes/No/NA)
  realisticTimeline: 'realisticTimeline',      // SP: Choice (Yes/No/NA)
  scopesBeforeProposals: 'scopesBeforeProposals', // SP: Choice (Yes/No/NA)
  threeBidsPerTrade: 'threeBidsPerTrade',      // SP: Choice (Yes/No/NA)
  reasonableITBTime: 'reasonableITBTime',      // SP: Choice (Yes/No/NA)
  bidsSavedProperly: 'bidsSavedProperly',      // SP: Choice (Yes/No/NA)
  multipleSubCommunications: 'multipleSubCommunications', // SP: Choice (Yes/No/NA)
  vettedProposals: 'vettedProposals',          // SP: Choice (Yes/No/NA)
  reasonableSpread: 'reasonableSpread',        // SP: Choice (Yes/No/NA)
  pricesMatchHistorical: 'pricesMatchHistorical', // SP: Choice (Yes/No/NA)
  veOptionsOffered: 'veOptionsOffered',        // SP: Choice (Yes/No/NA)
  deliverablesOnTime: 'deliverablesOnTime',    // SP: Choice (Yes/No/NA)

  // Scoring & Discussion
  processScore: 'processScore',                // SP: Number
  strengths: 'strengths',                      // SP: Multiple Lines of Text
  weaknesses: 'weaknesses',                    // SP: Multiple Lines of Text
  opportunities: 'opportunities',              // SP: Multiple Lines of Text
  challenges: 'challenges',                    // SP: Multiple Lines of Text
  overallRating: 'overallRating',              // SP: Number

  // Meeting & Status
  meetingScheduledDate: 'meetingScheduledDate', // SP: DateTime
  meetingAttendees: 'meetingAttendees',         // SP: Multiple Lines of Text (JSON array)
  isFinalized: 'isFinalized',                  // SP: Yes/No
  finalizedDate: 'finalizedDate',              // SP: DateTime
  finalizedBy: 'finalizedBy',                  // SP: Single Line of Text
} as const;

/**
 * List: Marketing_Project_Records
 * Interface: IMarketingProjectRecord
 * Hub-level list (aggregated across projects)
 */
export const MARKETING_PROJECT_RECORDS_COLUMNS = {
  // Section 1: Project Info
  projectName: 'projectName',                  // SP: Single Line of Text (denormalized)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  leadId: 'leadId',                            // SP: Number (lookup ID)
  contractType: 'contractType',                // SP: Multiple Lines of Text (JSON array)
  deliveryMethod: 'deliveryMethod',            // SP: Single Line of Text
  architect: 'architect',                      // SP: Single Line of Text
  landscapeArchitect: 'landscapeArchitect',    // SP: Single Line of Text
  interiorDesigner: 'interiorDesigner',        // SP: Single Line of Text
  engineer: 'engineer',                        // SP: Single Line of Text

  // Section 2: Description
  buildingSystemType: 'buildingSystemType',    // SP: Single Line of Text
  projectDescription: 'projectDescription',    // SP: Multiple Lines of Text
  uniqueCharacteristics: 'uniqueCharacteristics', // SP: Multiple Lines of Text
  renderingUrls: 'renderingUrls',              // SP: Multiple Lines of Text (JSON array)
  finalPhotoUrls: 'finalPhotoUrls',            // SP: Multiple Lines of Text (JSON array)

  // Section 3: Budget
  contractBudget: 'contractBudget',            // SP: Currency (denormalized from Leads_Master.ProjectValue)
  contractFinalCost: 'contractFinalCost',      // SP: Currency
  totalCostPerGSF: 'totalCostPerGSF',          // SP: Number
  totalBudgetVariance: 'totalBudgetVariance',  // SP: Currency
  budgetExplanation: 'budgetExplanation',      // SP: Multiple Lines of Text
  CO_OwnerDirected_Count: 'CO_OwnerDirected_Count',     // SP: Number
  CO_OwnerDirected_Value: 'CO_OwnerDirected_Value',     // SP: Currency
  CO_MunicipalityDirected_Count: 'CO_MunicipalityDirected_Count', // SP: Number
  CO_MunicipalityDirected_Value: 'CO_MunicipalityDirected_Value', // SP: Currency
  CO_EO_Count: 'CO_EO_Count',                 // SP: Number
  CO_EO_Value: 'CO_EO_Value',                 // SP: Currency
  CO_ContractorDirected_Count: 'CO_ContractorDirected_Count',     // SP: Number
  savingsReturned: 'savingsReturned',          // SP: Currency
  savingsReturnedPct: 'savingsReturnedPct',    // SP: Number

  // Section 4: Schedule
  scheduleStartAnticipated: 'scheduleStartAnticipated', // SP: DateTime
  scheduleStartActual: 'scheduleStartActual',           // SP: DateTime
  scheduleEndAnticipated: 'scheduleEndAnticipated',     // SP: DateTime
  scheduleEndActual: 'scheduleEndActual',               // SP: DateTime
  onSchedule: 'onSchedule',                    // SP: Single Line of Text
  scheduleExplanation: 'scheduleExplanation',  // SP: Multiple Lines of Text
  substantialCompletionDate: 'substantialCompletionDate', // SP: DateTime
  finalCompletionDate: 'finalCompletionDate',  // SP: DateTime

  // Section 5: QC
  punchListItems: 'punchListItems',            // SP: Number
  punchListDaysToComplete: 'punchListDaysToComplete', // SP: Number

  // Section 6: Safety
  innovativeSafetyPrograms: 'innovativeSafetyPrograms', // SP: Multiple Lines of Text

  // Section 7: Supplier Diversity
  mwbeRequirement: 'mwbeRequirement',          // SP: Single Line of Text
  mwbeAchievement: 'mwbeAchievement',          // SP: Single Line of Text
  sbeRequirement: 'sbeRequirement',            // SP: Single Line of Text
  sbeAchievement: 'sbeAchievement',            // SP: Single Line of Text
  localRequirement: 'localRequirement',        // SP: Single Line of Text
  localAchievement: 'localAchievement',        // SP: Single Line of Text

  // Section 8: Sustainability
  leedDesignation: 'leedDesignation',          // SP: Single Line of Text
  sustainabilityFeatures: 'sustainabilityFeatures', // SP: Multiple Lines of Text
  leedAdditionalCost: 'leedAdditionalCost',    // SP: Currency

  // Section 9: Case Study
  CS_Conflicts: 'CS_Conflicts',                // SP: Multiple Lines of Text
  CS_CostControl: 'CS_CostControl',            // SP: Multiple Lines of Text
  CS_ValueEngineering: 'CS_ValueEngineering',  // SP: Multiple Lines of Text
  CS_QualityControl: 'CS_QualityControl',      // SP: Multiple Lines of Text
  CS_Schedule: 'CS_Schedule',                  // SP: Multiple Lines of Text
  CS_Team: 'CS_Team',                          // SP: Multiple Lines of Text
  CS_Safety: 'CS_Safety',                      // SP: Multiple Lines of Text
  CS_LEED: 'CS_LEED',                          // SP: Multiple Lines of Text
  CS_SupplierDiversity: 'CS_SupplierDiversity', // SP: Multiple Lines of Text
  CS_Challenges: 'CS_Challenges',              // SP: Multiple Lines of Text
  CS_InnovativeSolutions: 'CS_InnovativeSolutions', // SP: Multiple Lines of Text
  CS_ProductsSystems: 'CS_ProductsSystems',    // SP: Multiple Lines of Text
  CS_ClientService: 'CS_ClientService',        // SP: Multiple Lines of Text
  CS_LessonsLearned: 'CS_LessonsLearned',      // SP: Multiple Lines of Text

  // Meta
  sectionCompletion: 'sectionCompletion',      // SP: Multiple Lines of Text (JSON Record<string,number>)
  overallCompletion: 'overallCompletion',       // SP: Number
  lastUpdatedBy: 'lastUpdatedBy',              // SP: Single Line of Text
  lastUpdatedAt: 'lastUpdatedAt',              // SP: DateTime
  createdBy: 'createdBy',                      // SP: Single Line of Text
  createdAt: 'createdAt',                      // SP: DateTime
} as const;

/**
 * List: Lessons_Learned_Hub
 * Interface: ILessonLearned (hub-level aggregation)
 */
export const LESSONS_LEARNED_HUB_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  title: 'title',                              // SP: Single Line of Text
  category: 'category',                        // SP: Choice (LessonCategory)
  impact: 'impact',                            // SP: Choice (LessonImpact)
  description: 'description',                  // SP: Multiple Lines of Text
  recommendation: 'recommendation',            // SP: Multiple Lines of Text
  raisedBy: 'raisedBy',                        // SP: Single Line of Text
  raisedDate: 'raisedDate',                    // SP: DateTime
  phase: 'phase',                              // SP: Single Line of Text
  isIncludedInFinalRecord: 'isIncludedInFinalRecord', // SP: Yes/No
  tags: 'tags',                                // SP: Multiple Lines of Text (JSON array)
} as const;

/**
 * List: Project_Types
 * Interface: IProjectType
 */
export const PROJECT_TYPES_COLUMNS = {
  code: 'code',                                // SP: Single Line of Text
  label: 'label',                              // SP: Single Line of Text
  office: 'office',                            // SP: Single Line of Text
} as const;

/**
 * List: Standard_Cost_Codes
 * Interface: IStandardCostCode
 */
export const STANDARD_COST_CODES_COLUMNS = {
  id: 'id',                                    // SP: Single Line of Text (not auto-generated; custom code)
  description: 'description',                  // SP: Single Line of Text
  phase: 'phase',                              // SP: Single Line of Text
  division: 'division',                        // SP: Single Line of Text
  isDefault: 'isDefault',                      // SP: Yes/No
} as const;


// ════════════════════════════════════════════════════════════════════════════
// ──── Project-Level Lists ────
// ════════════════════════════════════════════════════════════════════════════

/**
 * List: Project_Info
 * Used for project-level metadata; fields overlap with ILead denormalized data
 */
export const PROJECT_INFO_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  Title: 'Title',                              // SP: Single Line of Text
  ProjectCode: 'ProjectCode',                  // SP: Single Line of Text
  LeadID: 'LeadID',                            // SP: Number (lookup ID)
  ProjectSiteURL: 'ProjectSiteURL',            // SP: Hyperlink
} as const;

/**
 * List: Team_Members
 * Interface: ITeamMember
 */
export const TEAM_MEMBERS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  name: 'name',                                // SP: Single Line of Text
  email: 'email',                              // SP: Single Line of Text
  role: 'role',                                // SP: Choice (RoleName enum)
  department: 'department',                    // SP: Single Line of Text
  phone: 'phone',                              // SP: Single Line of Text
} as const;

/**
 * List: Deliverables
 * Interface: IDeliverable
 */
export const DELIVERABLES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  name: 'name',                                // SP: Single Line of Text
  department: 'department',                    // SP: Choice
  assignedTo: 'assignedTo',                    // SP: Single Line of Text
  assignedToId: 'assignedToId',                // SP: Number (Person lookup ID)
  status: 'status',                            // SP: Choice (DeliverableStatus enum)
  dueDate: 'dueDate',                          // SP: DateTime
  completedDate: 'completedDate',              // SP: DateTime
  notes: 'notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Action_Items
 * Interface: IActionItem
 */
export const ACTION_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  autopsyId: 'autopsyId',                      // SP: Number (FK to Loss_Autopsies.ID)
  description: 'description',                  // SP: Single Line of Text
  assignee: 'assignee',                        // SP: Single Line of Text
  assigneeId: 'assigneeId',                    // SP: Number (Person lookup ID)
  dueDate: 'dueDate',                          // SP: DateTime
  status: 'status',                            // SP: Choice (ActionItemStatus enum)
  completedDate: 'completedDate',              // SP: DateTime
} as const;

/**
 * List: Turnover_Checklist
 * Interface: ITurnoverItem
 */
export const TURNOVER_CHECKLIST_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  category: 'category',                        // SP: Choice (TurnoverCategory enum)
  description: 'description',                  // SP: Single Line of Text
  status: 'status',                            // SP: Choice
  assignedTo: 'assignedTo',                    // SP: Single Line of Text
  assignedToId: 'assignedToId',                // SP: Number (Person lookup ID)
  required: 'required',                        // SP: Yes/No
  completedDate: 'completedDate',              // SP: DateTime
  notes: 'notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Buyout_Log
 * Interface: IBuyoutEntry
 * Note: approvalHistory[] stored in child list → Commitment_Approvals
 */
export const BUYOUT_LOG_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  divisionCode: 'divisionCode',                // SP: Single Line of Text
  divisionDescription: 'divisionDescription',  // SP: Single Line of Text
  isStandard: 'isStandard',                    // SP: Yes/No

  // Budgeting
  originalBudget: 'originalBudget',            // SP: Currency
  estimatedTax: 'estimatedTax',                // SP: Currency
  totalBudget: 'totalBudget',                  // SP: Currency (calculated)

  // Award Information
  subcontractorName: 'subcontractorName',      // SP: Single Line of Text
  contractValue: 'contractValue',              // SP: Currency
  overUnder: 'overUnder',                      // SP: Currency (calculated)

  // Compliance (Tracking Only)
  enrolledInSDI: 'enrolledInSDI',              // SP: Yes/No
  bondRequired: 'bondRequired',                // SP: Yes/No

  // Risk Profile (Compass Integration)
  qScore: 'qScore',                            // SP: Number
  compassPreQualStatus: 'compassPreQualStatus', // SP: Choice

  // Compliance Checklist
  scopeMatchesBudget: 'scopeMatchesBudget',    // SP: Yes/No
  exhibitCInsuranceConfirmed: 'exhibitCInsuranceConfirmed', // SP: Yes/No
  exhibitDScheduleConfirmed: 'exhibitDScheduleConfirmed',   // SP: Yes/No
  exhibitESafetyConfirmed: 'exhibitESafetyConfirmed',       // SP: Yes/No

  // Commitment Status & Workflow
  commitmentStatus: 'commitmentStatus',        // SP: Choice (CommitmentStatus)
  waiverRequired: 'waiverRequired',            // SP: Yes/No
  waiverType: 'waiverType',                    // SP: Choice (WaiverType)
  waiverReason: 'waiverReason',                // SP: Multiple Lines of Text

  // Compiled Commitment Document
  compiledCommitmentPdfUrl: 'compiledCommitmentPdfUrl',       // SP: Hyperlink
  compiledCommitmentFileId: 'compiledCommitmentFileId',       // SP: Single Line of Text
  compiledCommitmentFileName: 'compiledCommitmentFileName',   // SP: Single Line of Text

  // E-Verify Compliance
  eVerifyContractNumber: 'eVerifyContractNumber', // SP: Single Line of Text
  eVerifySentDate: 'eVerifySentDate',          // SP: DateTime
  eVerifyReminderDate: 'eVerifyReminderDate',  // SP: DateTime
  eVerifyReceivedDate: 'eVerifyReceivedDate',  // SP: DateTime
  eVerifyStatus: 'eVerifyStatus',              // SP: Choice

  // Approval Tracking
  currentApprovalStep: 'currentApprovalStep',  // SP: Choice (ApprovalStep)
  // approvalHistory: stored in child list → Commitment_Approvals

  // Milestone Dates
  loiSentDate: 'loiSentDate',                  // SP: DateTime
  loiReturnedDate: 'loiReturnedDate',          // SP: DateTime
  contractSentDate: 'contractSentDate',        // SP: DateTime
  contractExecutedDate: 'contractExecutedDate', // SP: DateTime
  insuranceCOIReceivedDate: 'insuranceCOIReceivedDate', // SP: DateTime

  // Status (legacy)
  status: 'status',                            // SP: Choice (BuyoutStatus)
  notes: 'notes',                              // SP: Multiple Lines of Text
  createdDate: 'createdDate',                  // SP: DateTime
  modifiedDate: 'modifiedDate',                // SP: DateTime
} as const;

/**
 * List: Commitment_Approvals
 * Interface: ICommitmentApproval
 * Child list of Buyout_Log
 */
export const COMMITMENT_APPROVALS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  buyoutEntryId: 'buyoutEntryId',              // SP: Number (FK to Buyout_Log.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  step: 'step',                                // SP: Choice (ApprovalStep)
  approverName: 'approverName',                // SP: Single Line of Text
  approverEmail: 'approverEmail',              // SP: Single Line of Text
  status: 'status',                            // SP: Choice
  comment: 'comment',                          // SP: Multiple Lines of Text
  actionDate: 'actionDate',                    // SP: DateTime
  waiverType: 'waiverType',                    // SP: Choice (WaiverType)
} as const;

/**
 * List: Startup_Checklist
 * Interface: IStartupChecklistItem
 * Note: activityLog[] stored in child list → Checklist_Activity_Log
 */
export const STARTUP_CHECKLIST_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  sectionNumber: 'sectionNumber',              // SP: Number
  sectionName: 'sectionName',                  // SP: Single Line of Text
  itemNumber: 'itemNumber',                    // SP: Single Line of Text
  label: 'label',                              // SP: Single Line of Text
  responseType: 'responseType',                // SP: Choice (ChecklistResponseType)
  response: 'response',                        // SP: Single Line of Text
  status: 'status',                            // SP: Choice (ChecklistStatus)
  respondedBy: 'respondedBy',                  // SP: Single Line of Text
  respondedDate: 'respondedDate',              // SP: DateTime
  assignedTo: 'assignedTo',                    // SP: Single Line of Text
  assignedToName: 'assignedToName',            // SP: Single Line of Text
  comment: 'comment',                          // SP: Multiple Lines of Text
  isHidden: 'isHidden',                        // SP: Yes/No
  isCustom: 'isCustom',                        // SP: Yes/No
  sortOrder: 'sortOrder',                      // SP: Number
  // activityLog: stored in child list → Checklist_Activity_Log
} as const;

/**
 * List: Checklist_Activity_Log
 * Interface: IChecklistActivityEntry
 * Child list of Startup_Checklist
 */
export const CHECKLIST_ACTIVITY_LOG_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  checklistItemId: 'checklistItemId',          // SP: Number (FK to Startup_Checklist.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  timestamp: 'timestamp',                      // SP: DateTime
  user: 'user',                                // SP: Single Line of Text
  previousValue: 'previousValue',              // SP: Single Line of Text
  newValue: 'newValue',                        // SP: Single Line of Text
  comment: 'comment',                          // SP: Multiple Lines of Text
} as const;

/**
 * List: Internal_Matrix
 * Interface: IInternalMatrixTask
 */
export const INTERNAL_MATRIX_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  sortOrder: 'sortOrder',                      // SP: Number
  taskCategory: 'taskCategory',                // SP: Single Line of Text
  taskDescription: 'taskDescription',          // SP: Single Line of Text
  PX: 'PX',                                    // SP: Choice (MatrixAssignment)
  SrPM: 'SrPM',                                // SP: Choice (MatrixAssignment)
  PM2: 'PM2',                                  // SP: Choice (MatrixAssignment)
  PM1: 'PM1',                                  // SP: Choice (MatrixAssignment)
  PA: 'PA',                                    // SP: Choice (MatrixAssignment)
  QAQC: 'QAQC',                                // SP: Choice (MatrixAssignment)
  ProjAcct: 'ProjAcct',                        // SP: Choice (MatrixAssignment)
  isHidden: 'isHidden',                        // SP: Yes/No
  isCustom: 'isCustom',                        // SP: Yes/No
} as const;

/**
 * List: Owner_Contract_Matrix
 * Interface: IOwnerContractArticle
 */
export const OWNER_CONTRACT_MATRIX_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  sortOrder: 'sortOrder',                      // SP: Number
  articleNumber: 'articleNumber',              // SP: Single Line of Text
  pageNumber: 'pageNumber',                    // SP: Single Line of Text
  responsibleParty: 'responsibleParty',        // SP: Choice (OwnerContractParty)
  description: 'description',                  // SP: Multiple Lines of Text
  isHidden: 'isHidden',                        // SP: Yes/No
  isCustom: 'isCustom',                        // SP: Yes/No
} as const;

/**
 * List: Sub_Contract_Matrix
 * Interface: ISubContractClause
 */
export const SUB_CONTRACT_MATRIX_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  sortOrder: 'sortOrder',                      // SP: Number
  refNumber: 'refNumber',                      // SP: Single Line of Text
  pageNumber: 'pageNumber',                    // SP: Single Line of Text
  clauseDescription: 'clauseDescription',      // SP: Multiple Lines of Text
  ProjExec: 'ProjExec',                        // SP: Choice (MatrixAssignment)
  ProjMgr: 'ProjMgr',                          // SP: Choice (MatrixAssignment)
  AsstPM: 'AsstPM',                            // SP: Choice (MatrixAssignment)
  Super: 'Super',                              // SP: Choice (MatrixAssignment)
  ProjAdmin: 'ProjAdmin',                      // SP: Choice (MatrixAssignment)
  isHidden: 'isHidden',                        // SP: Yes/No
  isCustom: 'isCustom',                        // SP: Yes/No
} as const;

/**
 * List: Risk_Cost_Management
 * Interface: IRiskCostManagement
 * Note: buyoutOpportunities[], potentialRisks[], potentialSavings[] stored in child list → Risk_Cost_Items
 */
export const RISK_COST_MANAGEMENT_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  contractType: 'contractType',                // SP: Single Line of Text
  contractAmount: 'contractAmount',            // SP: Currency (denormalized from Leads_Master.ProjectValue)
  // buyoutOpportunities, potentialRisks, potentialSavings: stored in child list → Risk_Cost_Items
  createdBy: 'createdBy',                      // SP: Single Line of Text
  createdAt: 'createdAt',                      // SP: DateTime
  lastUpdatedBy: 'lastUpdatedBy',              // SP: Single Line of Text
  lastUpdatedAt: 'lastUpdatedAt',              // SP: DateTime
} as const;

/**
 * List: Risk_Cost_Items
 * Interface: IRiskCostItem
 * Child list of Risk_Cost_Management
 */
export const RISK_COST_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  riskCostId: 'riskCostId',                    // SP: Number (FK to Risk_Cost_Management.ID)
  category: 'category',                        // SP: Choice (RiskCostCategory)
  letter: 'letter',                            // SP: Single Line of Text
  description: 'description',                  // SP: Multiple Lines of Text
  estimatedValue: 'estimatedValue',            // SP: Currency
  status: 'status',                            // SP: Choice (RiskCostItemStatus)
  notes: 'notes',                              // SP: Multiple Lines of Text
  createdDate: 'createdDate',                  // SP: DateTime
  updatedDate: 'updatedDate',                  // SP: DateTime
} as const;

/**
 * List: Quality_Concerns
 * Interface: IQualityConcern
 */
export const QUALITY_CONCERNS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  letter: 'letter',                            // SP: Single Line of Text
  description: 'description',                  // SP: Multiple Lines of Text
  raisedBy: 'raisedBy',                        // SP: Single Line of Text
  raisedDate: 'raisedDate',                    // SP: DateTime
  status: 'status',                            // SP: Choice (QualityConcernStatus)
  resolution: 'resolution',                    // SP: Multiple Lines of Text
  resolvedDate: 'resolvedDate',                // SP: DateTime
  notes: 'notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Safety_Concerns
 * Interface: ISafetyConcern
 */
export const SAFETY_CONCERNS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  safetyOfficerName: 'safetyOfficerName',      // SP: Single Line of Text
  safetyOfficerEmail: 'safetyOfficerEmail',    // SP: Single Line of Text
  letter: 'letter',                            // SP: Single Line of Text
  description: 'description',                  // SP: Multiple Lines of Text
  severity: 'severity',                        // SP: Choice (SafetyConcernSeverity)
  raisedBy: 'raisedBy',                        // SP: Single Line of Text
  raisedDate: 'raisedDate',                    // SP: DateTime
  status: 'status',                            // SP: Choice (SafetyConcernStatus)
  resolution: 'resolution',                    // SP: Multiple Lines of Text
  resolvedDate: 'resolvedDate',                // SP: DateTime
  notes: 'notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Project_Schedule
 * Interface: IProjectScheduleCriticalPath
 * Note: criticalPathConcerns[] stored in child list → Critical_Path_Items
 */
export const PROJECT_SCHEDULE_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  startDate: 'startDate',                      // SP: DateTime
  substantialCompletionDate: 'substantialCompletionDate', // SP: DateTime
  ntpDate: 'ntpDate',                          // SP: DateTime
  nocDate: 'nocDate',                          // SP: DateTime
  contractCalendarDays: 'contractCalendarDays', // SP: Number
  contractBasisType: 'contractBasisType',      // SP: Single Line of Text
  teamGoalDaysAhead: 'teamGoalDaysAhead',      // SP: Number
  teamGoalDescription: 'teamGoalDescription',  // SP: Multiple Lines of Text
  hasLiquidatedDamages: 'hasLiquidatedDamages', // SP: Yes/No
  liquidatedDamagesAmount: 'liquidatedDamagesAmount', // SP: Currency
  liquidatedDamagesTerms: 'liquidatedDamagesTerms',   // SP: Multiple Lines of Text
  // criticalPathConcerns: stored in child list → Critical_Path_Items
  createdBy: 'createdBy',                      // SP: Single Line of Text
  createdAt: 'createdAt',                      // SP: DateTime
  lastUpdatedBy: 'lastUpdatedBy',              // SP: Single Line of Text
  lastUpdatedAt: 'lastUpdatedAt',              // SP: DateTime
} as const;

/**
 * List: Critical_Path_Items
 * Interface: ICriticalPathItem
 * Child list of Project_Schedule
 */
export const CRITICAL_PATH_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  scheduleId: 'scheduleId',                    // SP: Number (FK to Project_Schedule.ID)
  letter: 'letter',                            // SP: Single Line of Text
  description: 'description',                  // SP: Multiple Lines of Text
  impactDescription: 'impactDescription',      // SP: Multiple Lines of Text
  status: 'status',                            // SP: Choice (CriticalPathStatus)
  mitigationPlan: 'mitigationPlan',            // SP: Multiple Lines of Text
  createdDate: 'createdDate',                  // SP: DateTime
  updatedDate: 'updatedDate',                  // SP: DateTime
} as const;

/**
 * List: Superintendent_Plan
 * Interface: ISuperintendentPlan
 * Note: sections[] stored in child list → Superintendent_Plan_Sections
 */
export const SUPERINTENDENT_PLAN_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  superintendentName: 'superintendentName',    // SP: Single Line of Text
  // sections: stored in child list → Superintendent_Plan_Sections
  createdBy: 'createdBy',                      // SP: Single Line of Text
  createdAt: 'createdAt',                      // SP: DateTime
  lastUpdatedBy: 'lastUpdatedBy',              // SP: Single Line of Text
  lastUpdatedAt: 'lastUpdatedAt',              // SP: DateTime
} as const;

/**
 * List: Superintendent_Plan_Sections
 * Interface: ISuperintendentPlanSection
 * Child list of Superintendent_Plan
 */
export const SUPERINTENDENT_PLAN_SECTIONS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  superintendentPlanId: 'superintendentPlanId', // SP: Number (FK to Superintendent_Plan.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  sectionKey: 'sectionKey',                    // SP: Single Line of Text
  sectionTitle: 'sectionTitle',                // SP: Single Line of Text
  content: 'content',                          // SP: Multiple Lines of Text
  attachmentUrls: 'attachmentUrls',            // SP: Multiple Lines of Text (JSON array)
  isComplete: 'isComplete',                    // SP: Yes/No
} as const;

/**
 * List: Lessons_Learned
 * Interface: ILessonLearned (project-level)
 */
export const LESSONS_LEARNED_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  title: 'title',                              // SP: Single Line of Text
  category: 'category',                        // SP: Choice (LessonCategory)
  impact: 'impact',                            // SP: Choice (LessonImpact)
  description: 'description',                  // SP: Multiple Lines of Text
  recommendation: 'recommendation',            // SP: Multiple Lines of Text
  raisedBy: 'raisedBy',                        // SP: Single Line of Text
  raisedDate: 'raisedDate',                    // SP: DateTime
  phase: 'phase',                              // SP: Single Line of Text
  isIncludedInFinalRecord: 'isIncludedInFinalRecord', // SP: Yes/No
  tags: 'tags',                                // SP: Multiple Lines of Text (JSON array)
} as const;

/**
 * List: Project_Management_Plans
 * Interface: IProjectManagementPlan
 * Note: startupSignatures[], completionSignatures[] → PMP_Signatures
 *       approvalCycles[] → PMP_Approval_Cycles → PMP_Approval_Steps
 */
export const PMP_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  projectName: 'projectName',                  // SP: Single Line of Text (denormalized)
  jobNumber: 'jobNumber',                      // SP: Single Line of Text
  status: 'status',                            // SP: Choice (PMPStatus)
  currentCycleNumber: 'currentCycleNumber',    // SP: Number
  division: 'division',                        // SP: Single Line of Text

  // PMP-only fields
  superintendentPlan: 'superintendentPlan',     // SP: Multiple Lines of Text
  preconMeetingNotes: 'preconMeetingNotes',    // SP: Multiple Lines of Text
  siteManagementNotes: 'siteManagementNotes',  // SP: Multiple Lines of Text
  projectAdminBuyoutDate: 'projectAdminBuyoutDate', // SP: DateTime
  attachmentUrls: 'attachmentUrls',            // SP: Multiple Lines of Text (JSON array)

  // Aggregated references (stored as JSON snapshots)
  riskCostData: 'riskCostData',                // SP: Multiple Lines of Text (JSON)
  qualityConcerns: 'qualityConcerns',          // SP: Multiple Lines of Text (JSON array)
  safetyConcerns: 'safetyConcerns',            // SP: Multiple Lines of Text (JSON array)
  scheduleData: 'scheduleData',                // SP: Multiple Lines of Text (JSON)
  superintendentPlanData: 'superintendentPlanData', // SP: Multiple Lines of Text (JSON)
  lessonsLearned: 'lessonsLearned',            // SP: Multiple Lines of Text (JSON array)
  teamAssignments: 'teamAssignments',          // SP: Multiple Lines of Text (JSON array)

  // Signatures & Approval: stored in child lists
  // startupSignatures, completionSignatures → PMP_Signatures
  // approvalCycles → PMP_Approval_Cycles
  boilerplate: 'boilerplate',                  // SP: Multiple Lines of Text (JSON array of IPMPBoilerplateSection)

  // Meta
  createdBy: 'createdBy',                      // SP: Single Line of Text
  createdAt: 'createdAt',                      // SP: DateTime
  lastUpdatedBy: 'lastUpdatedBy',              // SP: Single Line of Text
  lastUpdatedAt: 'lastUpdatedAt',              // SP: DateTime
} as const;

/**
 * List: PMP_Signatures
 * Interface: IPMPSignature
 * Child list of Project_Management_Plans
 */
export const PMP_SIGNATURES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  pmpId: 'pmpId',                              // SP: Number (FK to Project_Management_Plans.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  signatureType: 'signatureType',              // SP: Choice (PMPSignatureType)
  role: 'role',                                // SP: Single Line of Text
  personName: 'personName',                    // SP: Single Line of Text
  personEmail: 'personEmail',                  // SP: Single Line of Text
  isRequired: 'isRequired',                    // SP: Yes/No
  isLead: 'isLead',                            // SP: Yes/No
  status: 'status',                            // SP: Choice (PMPSignatureStatus)
  signedDate: 'signedDate',                    // SP: DateTime
  affidavitText: 'affidavitText',              // SP: Multiple Lines of Text
  comment: 'comment',                          // SP: Multiple Lines of Text
} as const;

/**
 * List: PMP_Approval_Cycles
 * Interface: IPMPApprovalCycle
 * Note: steps[] stored in child list → PMP_Approval_Steps
 */
export const PMP_APPROVAL_CYCLES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  pmpId: 'pmpId',                              // SP: Number (FK to Project_Management_Plans.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  cycleNumber: 'cycleNumber',                  // SP: Number
  submittedBy: 'submittedBy',                  // SP: Single Line of Text
  submittedDate: 'submittedDate',              // SP: DateTime
  status: 'status',                            // SP: Choice
  // steps: stored in child list → PMP_Approval_Steps
  changesFromPrevious: 'changesFromPrevious',  // SP: Multiple Lines of Text (JSON array)
} as const;

/**
 * List: PMP_Approval_Steps
 * Interface: IPMPApprovalStep
 * Child list of PMP_Approval_Cycles
 */
export const PMP_APPROVAL_STEPS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  approvalCycleId: 'approvalCycleId',          // SP: Number (FK to PMP_Approval_Cycles.ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  stepOrder: 'stepOrder',                      // SP: Number
  approverRole: 'approverRole',                // SP: Single Line of Text
  approverName: 'approverName',                // SP: Single Line of Text
  approverEmail: 'approverEmail',              // SP: Single Line of Text
  status: 'status',                            // SP: Choice
  comment: 'comment',                          // SP: Multiple Lines of Text
  actionDate: 'actionDate',                    // SP: DateTime
  approvalCycleNumber: 'approvalCycleNumber',  // SP: Number
} as const;

/**
 * List: Monthly_Reviews
 * Interface: IMonthlyProjectReview
 * Note: checklistItems[] → Monthly_Checklist_Items, followUps[] → Monthly_Follow_Ups
 */
export const MONTHLY_REVIEWS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  reviewMonth: 'reviewMonth',                  // SP: Single Line of Text
  status: 'status',                            // SP: Choice (MonthlyReviewStatus)
  dueDate: 'dueDate',                          // SP: DateTime
  meetingDate: 'meetingDate',                  // SP: DateTime
  pmSubmittedDate: 'pmSubmittedDate',          // SP: DateTime
  pxReviewDate: 'pxReviewDate',                // SP: DateTime
  pxValidationDate: 'pxValidationDate',        // SP: DateTime
  leadershipSubmitDate: 'leadershipSubmitDate', // SP: DateTime
  completedDate: 'completedDate',              // SP: DateTime
  // checklistItems: stored in child list → Monthly_Checklist_Items
  // followUps: stored in child list → Monthly_Follow_Ups
  reportDocumentUrls: 'reportDocumentUrls',    // SP: Multiple Lines of Text (JSON array)
  createdBy: 'createdBy',                      // SP: Single Line of Text
  createdAt: 'createdAt',                      // SP: DateTime
  lastUpdatedBy: 'lastUpdatedBy',              // SP: Single Line of Text
  lastUpdatedAt: 'lastUpdatedAt',              // SP: DateTime
} as const;

/**
 * List: Monthly_Checklist_Items
 * Interface: IMonthlyChecklistItem
 * Child list of Monthly_Reviews
 */
export const MONTHLY_CHECKLIST_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  reviewId: 'reviewId',                        // SP: Number (FK to Monthly_Reviews.ID)
  sectionKey: 'sectionKey',                    // SP: Single Line of Text
  sectionTitle: 'sectionTitle',                // SP: Single Line of Text
  itemKey: 'itemKey',                          // SP: Single Line of Text
  itemDescription: 'itemDescription',          // SP: Single Line of Text
  pmComment: 'pmComment',                      // SP: Multiple Lines of Text
  pxComment: 'pxComment',                      // SP: Multiple Lines of Text
  pxInitial: 'pxInitial',                      // SP: Single Line of Text
} as const;

/**
 * List: Monthly_Follow_Ups
 * Interface: IMonthlyFollowUp
 * Child list of Monthly_Reviews
 */
export const MONTHLY_FOLLOW_UPS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  reviewId: 'reviewId',                        // SP: Number (FK to Monthly_Reviews.ID)
  question: 'question',                        // SP: Multiple Lines of Text
  requestedBy: 'requestedBy',                  // SP: Single Line of Text
  requestedDate: 'requestedDate',              // SP: DateTime
  pmResponse: 'pmResponse',                    // SP: Multiple Lines of Text
  responseDate: 'responseDate',                // SP: DateTime
  pxForwardedDate: 'pxForwardedDate',          // SP: DateTime
  status: 'status',                            // SP: Choice
} as const;

/**
 * List: Closeout_Items
 * Interface: ICloseoutItem
 */
export const CLOSEOUT_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'projectCode',                  // SP: Single Line of Text
  category: 'category',                        // SP: Single Line of Text
  description: 'description',                  // SP: Single Line of Text
  status: 'status',                            // SP: Choice (CloseoutItemStatus)
  assignedTo: 'assignedTo',                    // SP: Single Line of Text
  assignedToId: 'assignedToId',                // SP: Number (Person lookup ID)
  completedDate: 'completedDate',              // SP: DateTime
  notes: 'notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Marketing_Project_Record
 * Interface: IMarketingProjectRecord (project-level instance)
 * Same shape as Marketing_Project_Records hub list
 */
export const MARKETING_PROJECT_RECORD_COLUMNS = {
  ...MARKETING_PROJECT_RECORDS_COLUMNS,
} as const;

/**
 * List: Contract_Info
 * Interface: IContractInfo
 */
export const CONTRACT_INFO_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  leadId: 'leadId',                            // SP: Number (lookup ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  contractStatus: 'contractStatus',            // SP: Choice (ContractStatus)
  contractType: 'contractType',                // SP: Single Line of Text
  contractValue: 'contractValue',              // SP: Currency
  insuranceRequirements: 'insuranceRequirements', // SP: Multiple Lines of Text
  bondRequirements: 'bondRequirements',        // SP: Multiple Lines of Text
  executionDate: 'executionDate',              // SP: DateTime
  noticeToProceed: 'noticeToProceed',          // SP: DateTime
  substantialCompletion: 'substantialCompletion', // SP: DateTime
  finalCompletion: 'finalCompletion',          // SP: DateTime
  documents: 'documents',                      // SP: Multiple Lines of Text (JSON array of URLs)
} as const;

/**
 * List: Interview_Prep
 * Interface: IInterviewPrep
 */
export const INTERVIEW_PREP_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  leadId: 'leadId',                            // SP: Number (lookup ID)
  projectCode: 'projectCode',                  // SP: Single Line of Text
  interviewDate: 'interviewDate',              // SP: DateTime
  interviewLocation: 'interviewLocation',      // SP: Single Line of Text
  panelMembers: 'panelMembers',                // SP: Multiple Lines of Text (JSON array)
  presentationTheme: 'presentationTheme',      // SP: Single Line of Text
  keyMessages: 'keyMessages',                  // SP: Multiple Lines of Text
  teamAssignments: 'teamAssignments',          // SP: Multiple Lines of Text
  rehearsalDate: 'rehearsalDate',              // SP: DateTime
  documents: 'documents',                      // SP: Multiple Lines of Text (JSON array of URLs)
} as const;

// ════════════════════════════════════════════════════════════════════════════
// ──── Workflow Definition Lists ────
// ════════════════════════════════════════════════════════════════════════════

/**
 * List: Workflow_Definitions
 * Interface: IWorkflowDefinition
 */
export const WORKFLOW_DEFINITIONS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  workflowKey: 'WorkflowKey',                  // SP: Choice (GO_NO_GO, PMP_APPROVAL, MONTHLY_REVIEW, COMMITMENT_APPROVAL)
  name: 'Title',                               // SP: Single Line of Text (default)
  description: 'Description',                  // SP: Multiple Lines of Text
  isActive: 'IsActive',                        // SP: Yes/No
  lastModifiedBy: 'LastModifiedBy',            // SP: Single Line of Text
  lastModifiedDate: 'LastModifiedDate',        // SP: DateTime
} as const;

/**
 * List: Workflow_Steps
 * Interface: IWorkflowStep
 */
export const WORKFLOW_STEPS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  workflowId: 'WorkflowId',                   // SP: Number (lookup ID to Workflow_Definitions)
  stepOrder: 'StepOrder',                      // SP: Number
  name: 'Title',                               // SP: Single Line of Text (default)
  description: 'Description',                  // SP: Multiple Lines of Text
  assignmentType: 'AssignmentType',            // SP: Choice (ProjectRole, NamedPerson)
  projectRole: 'ProjectRole',                  // SP: Choice (RoleName values)
  defaultAssignee: 'DefaultAssignee',          // SP: Multiple Lines of Text (JSON: IPersonAssignment)
  isConditional: 'IsConditional',              // SP: Yes/No
  conditionDescription: 'ConditionDescription',// SP: Single Line of Text
  actionLabel: 'ActionLabel',                  // SP: Single Line of Text
  canChairMeeting: 'CanChairMeeting',          // SP: Yes/No
} as const;

/**
 * List: Workflow_Conditional_Assignments
 * Interface: IConditionalAssignment
 */
export const WORKFLOW_CONDITIONAL_ASSIGNMENTS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  stepId: 'StepId',                            // SP: Number (lookup ID to Workflow_Steps)
  conditions: 'Conditions',                    // SP: Multiple Lines of Text (JSON: IAssignmentCondition[])
  assignee: 'Assignee',                        // SP: Multiple Lines of Text (JSON: IPersonAssignment)
  priority: 'Priority',                        // SP: Number
} as const;

/**
 * List: Workflow_Step_Overrides
 * Interface: IWorkflowStepOverride
 */
export const WORKFLOW_STEP_OVERRIDES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'ProjectCode',                 // SP: Single Line of Text
  workflowKey: 'WorkflowKey',                 // SP: Choice
  stepId: 'StepId',                            // SP: Number (lookup ID to Workflow_Steps)
  overrideAssignee: 'OverrideAssignee',        // SP: Multiple Lines of Text (JSON: IPersonAssignment)
  overrideReason: 'OverrideReason',            // SP: Single Line of Text
  overriddenBy: 'OverriddenBy',                // SP: Single Line of Text
  overriddenDate: 'OverriddenDate',            // SP: DateTime
} as const;

// ════════════════════════════════════════════════════════════════════════════
// ──── Turnover Agenda Lists ────
// ════════════════════════════════════════════════════════════════════════════

/**
 * List: Turnover_Agendas
 * Interface: ITurnoverAgenda
 */
export const TURNOVER_AGENDAS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  projectCode: 'ProjectCode',                 // SP: Single Line of Text
  leadId: 'LeadId',                            // SP: Number (lookup ID to Leads_Master)
  status: 'Status',                            // SP: Choice (TurnoverStatus)
  projectName: 'Title',                        // SP: Single Line of Text (default) @denormalized
  meetingDate: 'MeetingDate',                  // SP: DateTime
  recordingUrl: 'RecordingUrl',                // SP: Hyperlink
  turnoverFolderUrl: 'TurnoverFolderUrl',      // SP: Hyperlink
  bcPublished: 'BCPublished',                  // SP: Yes/No
  pmName: 'PMName',                            // SP: Single Line of Text
  apmName: 'APMName',                          // SP: Single Line of Text
  createdBy: 'CreatedBy',                      // SP: Single Line of Text
  createdDate: 'CreatedDate',                  // SP: DateTime
  lastModifiedBy: 'LastModifiedBy',            // SP: Single Line of Text
  lastModifiedDate: 'LastModifiedDate',        // SP: DateTime
} as const;

/**
 * List: Turnover_Prerequisites
 * Interface: ITurnoverPrerequisite
 */
export const TURNOVER_PREREQUISITES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  turnoverAgendaId: 'TurnoverAgendaId',        // SP: Number (lookup ID)
  sortOrder: 'SortOrder',                      // SP: Number
  label: 'Title',                              // SP: Single Line of Text (default)
  description: 'Description',                  // SP: Multiple Lines of Text
  completed: 'Completed',                      // SP: Yes/No
  completedBy: 'CompletedBy',                  // SP: Single Line of Text
  completedDate: 'CompletedDate',              // SP: DateTime
} as const;

/**
 * List: Turnover_Discussion_Items
 * Interface: ITurnoverDiscussionItem
 */
export const TURNOVER_DISCUSSION_ITEMS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  turnoverAgendaId: 'TurnoverAgendaId',        // SP: Number (lookup ID)
  sortOrder: 'SortOrder',                      // SP: Number
  label: 'Title',                              // SP: Single Line of Text (default)
  description: 'Description',                  // SP: Multiple Lines of Text
  discussed: 'Discussed',                      // SP: Yes/No
  notes: 'Notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Turnover_Subcontractors
 * Interface: ITurnoverSubcontractor
 */
export const TURNOVER_SUBCONTRACTORS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  turnoverAgendaId: 'TurnoverAgendaId',        // SP: Number (lookup ID)
  trade: 'Trade',                              // SP: Single Line of Text
  subcontractorName: 'Title',                  // SP: Single Line of Text (default)
  contactName: 'ContactName',                  // SP: Single Line of Text
  contactPhone: 'ContactPhone',                // SP: Single Line of Text
  contactEmail: 'ContactEmail',                // SP: Single Line of Text
  qScore: 'QScore',                            // SP: Number
  isPreferred: 'IsPreferred',                  // SP: Yes/No
  isRequired: 'IsRequired',                    // SP: Yes/No
  notes: 'Notes',                              // SP: Multiple Lines of Text
} as const;

/**
 * List: Turnover_Exhibits
 * Interface: ITurnoverExhibit
 */
export const TURNOVER_EXHIBITS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  turnoverAgendaId: 'TurnoverAgendaId',        // SP: Number (lookup ID)
  sortOrder: 'SortOrder',                      // SP: Number
  label: 'Title',                              // SP: Single Line of Text (default)
  isDefault: 'IsDefault',                      // SP: Yes/No
  reviewed: 'Reviewed',                        // SP: Yes/No
  reviewedBy: 'ReviewedBy',                    // SP: Single Line of Text
  reviewedDate: 'ReviewedDate',                // SP: DateTime
  linkedDocumentUrl: 'LinkedDocumentUrl',       // SP: Hyperlink
  uploadedFileName: 'UploadedFileName',        // SP: Single Line of Text
  uploadedFileUrl: 'UploadedFileUrl',          // SP: Hyperlink
} as const;

/**
 * List: Turnover_Signatures
 * Interface: ITurnoverSignature
 */
export const TURNOVER_SIGNATURES_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  turnoverAgendaId: 'TurnoverAgendaId',        // SP: Number (lookup ID)
  sortOrder: 'SortOrder',                      // SP: Number
  role: 'Role',                                // SP: Single Line of Text
  signerName: 'SignerName',                    // SP: Single Line of Text
  signerEmail: 'SignerEmail',                  // SP: Single Line of Text
  affidavitText: 'AffidavitText',              // SP: Multiple Lines of Text
  signed: 'Signed',                            // SP: Yes/No
  signedDate: 'SignedDate',                    // SP: DateTime
  comment: 'Comment',                          // SP: Multiple Lines of Text
} as const;

/**
 * List: Turnover_Attachments
 * Interface: ITurnoverAttachment
 */
export const TURNOVER_ATTACHMENTS_COLUMNS = {
  id: 'ID',                                    // SP: Auto-generated
  discussionItemId: 'DiscussionItemId',        // SP: Number (lookup ID)
  fileName: 'Title',                           // SP: Single Line of Text (default)
  fileUrl: 'FileUrl',                          // SP: Hyperlink
  uploadedBy: 'UploadedBy',                    // SP: Single Line of Text
  uploadedDate: 'UploadedDate',                // SP: DateTime
} as const;
