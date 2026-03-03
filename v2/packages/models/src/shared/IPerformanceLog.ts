export interface IPerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface IPerformanceLog {
  id: number;
  SessionId: string;
  Timestamp: string;
  UserEmail: string;
  SiteUrl: string;
  ProjectCode?: string;
  IsProjectSite: boolean;
  WebPartLoadMs: number;
  AppInitMs: number;
  DataFetchMs?: number;
  TotalLoadMs: number;
  Marks: IPerformanceMark[];
  UserAgent: string;
  SpfxVersion: string;
  Notes?: string;
}

export interface IPerformanceQueryOptions {
  startDate?: string;
  endDate?: string;
  siteUrl?: string;
  projectCode?: string;
  limit?: number;
}

export interface IPerformanceSummary {
  avgTotalLoadMs: number;
  avgWebPartLoadMs: number;
  avgAppInitMs: number;
  p95TotalLoadMs: number;
  totalSessions: number;
  slowSessionCount: number;
  byDay: { date: string; avgMs: number; count: number }[];
}
