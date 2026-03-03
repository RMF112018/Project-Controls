/**
 * Project Data Mart Model
 * Denormalized hub-site list aggregating operational data from 8+ project-site lists
 * into a single queryable view for executive dashboards and portfolio reporting.
 */

import { ProjectStatus, SectorType } from './IActiveProject';

export type DataMartHealthStatus = 'Green' | 'Yellow' | 'Red';

export interface IProjectDataMart {
  id: number;

  // ── Core Identity (6) ──
  projectCode: string;
  jobNumber: string;
  projectName: string;
  status: ProjectStatus;
  sector: SectorType;
  region: string;

  // ── Team (6) ──
  projectExecutive: string;
  projectExecutiveEmail: string;
  leadPM: string;
  leadPMEmail: string;
  leadSuperintendent: string;
  leadSuperintendentEmail: string;

  // ── Financials (10) ──
  originalContract: number;
  changeOrders: number;
  currentContractValue: number;
  billingsToDate: number;
  unbilledAmount: number;
  projectedFee: number;
  projectedFeePct: number;
  buyoutCommittedTotal: number;
  buyoutExecutedCount: number;
  buyoutOpenCount: number;

  // ── Schedule (5) ──
  startDate: string | null;
  substantialCompletionDate: string | null;
  percentComplete: number;
  criticalPathItemCount: number;
  scheduleDaysVariance: number;

  // ── Risk & Quality (6) ──
  openQualityConcerns: number;
  openSafetyConcerns: number;
  averageQScore: number;
  openWaiverCount: number;
  pendingCommitments: number;
  complianceStatus: DataMartHealthStatus;

  // ── Health & Alerts (4) ──
  overallHealth: DataMartHealthStatus;
  hasUnbilledAlert: boolean;
  hasScheduleAlert: boolean;
  hasFeeErosionAlert: boolean;

  // ── Status Tracking (4) ──
  monthlyReviewStatus: string;
  lastMonthlyReviewDate: string | null;
  turnoverStatus: string;
  pmpStatus: string;

  // ── Meta (2) ──
  lastSyncDate: string;
  lastSyncBy: string;
}

export interface IDataMartSyncResult {
  projectCode: string;
  success: boolean;
  syncedAt: string;
  error?: string;
}

export interface IDataMartFilter {
  status?: ProjectStatus;
  sector?: SectorType;
  region?: string;
  projectExecutive?: string;
  overallHealth?: DataMartHealthStatus;
  hasAlerts?: boolean;
}
