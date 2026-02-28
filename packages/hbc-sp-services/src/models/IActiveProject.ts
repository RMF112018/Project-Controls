/**
 * Active Projects Portfolio Model
 * Aggregates data from individual project sites for executive dashboard
 */

export type ProjectStatus = 'Precon' | 'Construction' | 'Final Payment';

export type SectorType = 'Commercial' | 'Residential';

/**
 * Personnel assignment for a project
 */
export interface IProjectPersonnel {
  projectExecutive?: string;
  projectExecutiveEmail?: string;
  leadPM?: string;
  leadPMEmail?: string;
  additionalPM?: string;
  assistantPM?: string;
  projectAccountant?: string;
  projectAssistant?: string;
  leadSuper?: string;
  superintendent?: string;
  assistantSuper?: string;
}

/**
 * Financial metrics for a project
 */
export interface IProjectFinancials {
  originalContract?: number;
  changeOrders?: number;
  currentContractValue?: number;
  billingsToDate?: number;
  unbilled?: number;
  projectedFee?: number;
  projectedFeePct?: number;
  projectedCost?: number;
  remainingValue?: number;
}

/**
 * Schedule information for a project
 */
export interface IProjectSchedule {
  startDate?: string;
  substantialCompletionDate?: string;
  nocExpiration?: string;
  currentPhase?: string;
  percentComplete?: number;
}

/**
 * Risk metrics aggregated from Risk Management module
 */
export interface IProjectRiskMetrics {
  averageQScore?: number;
  openWaiverCount?: number;
  pendingCommitments?: number;
  complianceStatus?: 'Green' | 'Yellow' | 'Red';
}

/**
 * Main Active Project interface
 * Represents a single project in the portfolio dashboard
 */
export interface IActiveProject {
  id: number;
  jobNumber: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  sector: SectorType;
  region?: string;
  
  // Personnel
  personnel: IProjectPersonnel;
  
  // Financials
  financials: IProjectFinancials;
  
  // Schedule
  schedule: IProjectSchedule;
  
  // Risk
  riskMetrics: IProjectRiskMetrics;
  
  // Status/Comments
  statusComments?: string;
  
  // Metadata
  projectSiteUrl?: string;
  lastSyncDate?: string;
  lastModified?: string;
  
  // Flags for alerts
  hasUnbilledAlert?: boolean;
  hasScheduleAlert?: boolean;
  hasFeeErosionAlert?: boolean;
}

/**
 * Portfolio summary metrics for KPI tiles
 */
export interface IPortfolioSummary {
  totalBacklog: number;
  totalOriginalContract: number;
  totalBillingsToDate: number;
  totalUnbilled: number;
  averageFeePct: number;
  monthlyBurnRate: number;
  projectCount: number;
  projectsByStatus: Record<ProjectStatus, number>;
  projectsBySector: Record<SectorType, number>;
  projectsWithAlerts: number;
}

/**
 * Personnel workload summary
 */
export interface IPersonnelWorkload {
  name: string;
  email?: string;
  role: 'PX' | 'PM' | 'Super';
  projectCount: number;
  totalContractValue: number;
  projects: IActiveProject[];
}

/**
 * Alert thresholds configuration
 */
export interface IAlertThresholds {
  unbilledWarningPct: number;  // Yellow threshold (e.g., 15%)
  unbilledCriticalPct: number; // Red threshold (e.g., 25%)
  feeErosionPct: number;       // Fee erosion warning threshold
  scheduleDelayDays: number;   // Days past completion date
}

export const DEFAULT_ALERT_THRESHOLDS: IAlertThresholds = {
  unbilledWarningPct: 15,
  unbilledCriticalPct: 25,
  feeErosionPct: 5,
  scheduleDelayDays: 30,
};
// TODO (Stage 19+): Add preconHandoffMetadata?: { estimatingId: string; preconFee: number; awardedDate: Date } | Audit: traceability from BD/Estimating | Impact: Medium
