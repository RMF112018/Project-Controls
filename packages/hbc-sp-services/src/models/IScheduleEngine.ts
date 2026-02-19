import { IScheduleActivity } from './IScheduleActivity';
import { IDataMartFilter } from './IProjectDataMart';

export interface IScheduleCpmActivityResult {
  externalActivityKey: string;
  earlyStartDay: number;
  earlyFinishDay: number;
  lateStartDay: number;
  lateFinishDay: number;
  totalFloatDays: number;
  freeFloatDays: number;
  isCritical: boolean;
}

export interface IScheduleDagDiagnostic {
  hasCycle: boolean;
  cyclePaths: string[][];
  openEndNodes: {
    noPred: string[];
    noSucc: string[];
  };
  orphanReferences: Array<{
    activityKey: string;
    missingRefTaskCode: string;
    refType: 'pred' | 'succ';
  }>;
  duplicatePredecessors: Array<{
    activityKey: string;
    duplicateTaskCodes: string[];
  }>;
  nodeCount: number;
  edgeCount: number;
}

export interface IScheduleCpmResult {
  projectCode: string;
  generatedAt: string;
  projectDurationDays: number;
  criticalPathExternalKeys: string[];
  activities: IScheduleCpmActivityResult[];
  warnings: string[];
  diagnostic: IScheduleDagDiagnostic;
}

export interface IDcmaCheckResult {
  id: string;
  name: string;
  passed: boolean;
  value: number;
  threshold: number;
  details: string;
}

export interface IScheduleQualityReport {
  projectCode: string;
  generatedAt: string;
  overallScore: number;
  dcmaChecks: IDcmaCheckResult[];
  remediationSteps: string[];
}

export interface IForensicWindow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  fragnetDelayDays: number;
}

export interface IForensicAnalysisResult {
  projectCode: string;
  generatedAt: string;
  totalAnalyzedDelayDays: number;
  windows: Array<{
    windowId: string;
    windowName: string;
    attributableDelayDays: number;
  }>;
}

export interface IMonteCarloConfig {
  iterations: number;
  seed?: number;
  scenarioId?: string;
}

export interface IMonteCarloResult {
  projectCode: string;
  iterations: number;
  p50FinishDay: number;
  p80FinishDay: number;
  p95FinishDay: number;
  sCurve: Array<{ finishDay: number; cumulativeProbability: number }>;
  tornado: Array<{ externalActivityKey: string; impactDays: number }>;
}

export interface IResourceLevelingResult {
  projectCode: string;
  generatedAt: string;
  overallocatedResourceCount: number;
  recommendations: string[];
}

export interface IScheduleScenario {
  id: string;
  projectCode: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IScheduleScenarioDiff {
  projectCode: string;
  leftScenarioId: string;
  rightScenarioId: string;
  changedActivities: number;
  addedActivities: number;
  removedActivities: number;
}

export interface IScheduleEvmResult {
  projectCode: string;
  bac: number;
  ev: number;
  pv: number;
  ac: number;
  sv: number;
  cv: number;
  spi: number | null;
  cpi: number | null;
  generatedAt: string;
}

export interface IFieldReadinessScore {
  projectCode: string;
  score: number;
  linkageCoveragePct: number;
  ppcProxy: number;
  openConstraintPenalty: number;
  openPermitPenalty: number;
  computedAt: string;
}

export interface IPortfolioScheduleHealth {
  projectCode: string;
  projectName?: string;
  scheduleHealthScore: number;
  spi: number | null;
  cpi: number | null;
  criticalCount: number;
  negativeFloatCount: number;
  fieldReadinessScore: number;
}

export interface IScheduleEngineRuntimeInfo {
  workerEnabled: boolean;
  wasmEnabled: boolean;
  fallbackReason?: string;
}

export interface IScheduleEngineOptions {
  projectCode: string;
  activities: IScheduleActivity[];
}

export interface ISchedulePortfolioFilter extends IDataMartFilter {}
