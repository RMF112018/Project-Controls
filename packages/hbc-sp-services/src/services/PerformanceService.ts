import { IPerformanceMark, IPerformanceLog } from '../models/IPerformanceLog';
import { APP_VERSION, PERFORMANCE_THRESHOLDS } from '../utils/constants';

export class PerformanceService {
  private marks: Map<string, number> = new Map();
  private completedMarks: IPerformanceMark[] = [];
  private sessionId: string;
  private initStartTime: number;
  private logFn: ((entry: Partial<IPerformanceLog>) => Promise<IPerformanceLog>) | null = null;

  constructor() {
    this.initStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  /** Wire up the data service logging function. */
  public initialize(logFunction: (entry: Partial<IPerformanceLog>) => Promise<IPerformanceLog>): void {
    this.logFn = logFunction;
  }

  /** Start timing a named mark. */
  public startMark(name: string): void {
    this.marks.set(name, this.now());
  }

  /** End a named mark and record its duration. */
  public endMark(name: string): void {
    const startTime = this.marks.get(name);
    if (startTime === undefined) return;
    const endTime = this.now();
    this.completedMarks.push({
      name,
      startTime,
      endTime,
      duration: Math.round(endTime - startTime),
    });
    this.marks.delete(name);
  }

  /** Get a completed mark by name. */
  public getMark(name: string): IPerformanceMark | undefined {
    return this.completedMarks.find(m => m.name === name);
  }

  /** Get all completed marks. */
  public getAllMarks(): IPerformanceMark[] {
    return [...this.completedMarks];
  }

  /** Get the session ID for this page load. */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Assemble and log a performance entry from all completed marks.
   * Called once at end of AppContext init.
   */
  public async logWebPartLoad(context: {
    userEmail: string;
    siteUrl: string;
    projectCode?: string;
    isProjectSite: boolean;
  }): Promise<IPerformanceLog | null> {
    if (!this.logFn) {
      console.warn('[PerformanceService] logFn not initialized — skipping log');
      return null;
    }

    // Sampling: skip if random exceeds sample rate
    if (Math.random() > PERFORMANCE_THRESHOLDS.SAMPLE_RATE) {
      return null;
    }

    const webPartInit = this.getMark('webpart:onInit');
    const appInit = this.getMark('app:contextInit');
    const userFlagsFetch = this.getMark('app:userFlagsFetch');
    const totalEnd = this.now();

    const entry: Partial<IPerformanceLog> = {
      SessionId: this.sessionId,
      Timestamp: new Date().toISOString(),
      UserEmail: context.userEmail,
      SiteUrl: context.siteUrl,
      ProjectCode: context.projectCode,
      IsProjectSite: context.isProjectSite,
      WebPartLoadMs: webPartInit?.duration ?? 0,
      AppInitMs: appInit?.duration ?? 0,
      DataFetchMs: userFlagsFetch?.duration,
      TotalLoadMs: Math.round(totalEnd - this.initStartTime),
      Marks: this.completedMarks,
      UserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      SpfxVersion: APP_VERSION,
    };

    try {
      const result = await this.logFn(entry);
      return result as IPerformanceLog;
    } catch (err) {
      console.warn('[PerformanceService] Failed to log performance entry:', err);
      return null;
    }
  }

  /** Reset all marks (for testing). */
  public reset(): void {
    this.marks.clear();
    this.completedMarks = [];
    this.sessionId = this.generateSessionId();
    this.initStartTime = this.now();
  }
}

export const performanceService = new PerformanceService();
