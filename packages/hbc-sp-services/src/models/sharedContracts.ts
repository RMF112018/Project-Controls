import type { Stage, RoleName } from './enums';
import type { IAuditEntry } from './IAuditEntry';
import type { IPerformanceLog } from './IPerformanceLog';

export interface IDashboardPreference {
  layout?: string[];
  collapsedWidgets?: string[];
  filters?: Record<string, string | number | boolean | string[]>;
  viewMode?: string;
  updatedAt: string;
}

export type ProjectHealthStatus = 'Green' | 'Yellow' | 'Red';

export interface ISelectedProject {
  projectCode: string;
  projectName: string;
  stage: Stage;
  region?: string;
  division?: string;
  leadId?: number;
  siteUrl?: string;
  clientName?: string;
  projectValue?: number;
  overallHealth?: ProjectHealthStatus;
}

export interface ISidebarItem {
  label: string;
  path: string;
  icon?: string;
  permission?: string;
  featureFlag?: string;
}

export interface ISidebarGroup {
  label: string;
  items: ISidebarItem[];
}

export interface IWorkspaceConfig {
  id: string;
  label: string;
  icon: string;
  basePath: string;
  roles: RoleName[];
  featureFlag?: string;
  requireProject?: boolean;
  sidebarGroups: ISidebarGroup[];
}

export interface IFeatureUsage { feature: string; count: number }
export interface IRoleActivity { role: string; count: number }
export interface IAdoptionCell { day: number; hour: number; count: number }
export interface IProvisioningStat { status: 'success' | 'partial' | 'failed'; count: number }
export interface IErrorPoint { date: string; count: number }
export interface IForecastPoint { projectCode: string; estimated: number; actual: number }
export interface IChecklistPoint { projectCode: string; pct: number }
export interface ILoadPerf { date: string; p50: number; p95: number }

export interface ITelemetryMetrics {
  performanceLogs: IPerformanceLog[];
  auditLog: IAuditEntry[];
  featureUsage: IFeatureUsage[];
  roleActivity: IRoleActivity[];
  adoptionByHour: IAdoptionCell[];
  provisioningStats: IProvisioningStat[];
  errorTrend: IErrorPoint[];
  forecastAccuracy: IForecastPoint[];
  checklistCompletion: IChecklistPoint[];
  loadPerf: ILoadPerf[];
  isLoading: boolean;
  error: string | null;
}
