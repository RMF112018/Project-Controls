import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog } from '../models/IProvisioningLog';
import { GoNoGoDecision, Stage } from '../models/enums';

export interface IListQueryOptions {
  filter?: string;
  orderBy?: string;
  orderAscending?: boolean;
  top?: number;
  skip?: number;
  select?: string[];
}

export interface IPagedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

export interface IDataService {
  // Leads
  getLeads(options?: IListQueryOptions): Promise<IPagedResult<ILead>>;
  getLeadById(id: number): Promise<ILead | null>;
  getLeadsByStage(stage: Stage): Promise<ILead[]>;
  createLead(data: ILeadFormData): Promise<ILead>;
  updateLead(id: number, data: Partial<ILead>): Promise<ILead>;
  deleteLead(id: number): Promise<void>;
  searchLeads(query: string): Promise<ILead[]>;

  // Go/No-Go Scorecards
  getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null>;
  getScorecards(): Promise<IGoNoGoScorecard[]>;
  createScorecard(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard>;
  updateScorecard(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard>;
  submitGoNoGoDecision(scorecardId: number, decision: GoNoGoDecision, projectCode?: string): Promise<void>;

  // Estimating Tracker
  getEstimatingRecords(options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>>;
  getEstimatingRecordById(id: number): Promise<IEstimatingTracker | null>;
  getEstimatingByLeadId(leadId: number): Promise<IEstimatingTracker | null>;
  createEstimatingRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker>;
  updateEstimatingRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker>;
  getCurrentPursuits(): Promise<IEstimatingTracker[]>;
  getPreconEngagements(): Promise<IEstimatingTracker[]>;
  getEstimateLog(): Promise<IEstimatingTracker[]>;

  // RBAC
  getCurrentUser(): Promise<ICurrentUser>;
  getRoles(): Promise<IRole[]>;
  updateRole(id: number, data: Partial<IRole>): Promise<IRole>;

  // Feature Flags
  getFeatureFlags(): Promise<IFeatureFlag[]>;
  updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag>;

  // Meetings / Calendar
  getCalendarAvailability(emails: string[], startDate: string, endDate: string): Promise<ICalendarAvailability[]>;
  createMeeting(meeting: Partial<IMeeting>): Promise<IMeeting>;
  getMeetings(projectCode?: string): Promise<IMeeting[]>;

  // Notifications
  sendNotification(notification: Partial<INotification>): Promise<INotification>;
  getNotifications(projectCode?: string): Promise<INotification[]>;

  // Audit Log
  logAudit(entry: Partial<IAuditEntry>): Promise<void>;
  getAuditLog(entityType?: string, entityId?: string): Promise<IAuditEntry[]>;

  // Provisioning
  triggerProvisioning(leadId: number, projectCode: string, projectName: string, requestedBy: string): Promise<IProvisioningLog>;
  getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null>;
  updateProvisioningLog(projectCode: string, data: Partial<IProvisioningLog>): Promise<IProvisioningLog>;
  getProvisioningLogs(): Promise<IProvisioningLog[]>;
  retryProvisioning(projectCode: string, fromStep: number): Promise<IProvisioningLog>;

  // Lookups
  getTemplates(): Promise<Array<{ TemplateName: string; SourceURL: string; TargetFolder: string; Division: string; Active: boolean }>>;
  getRegions(): Promise<string[]>;
  getSectors(): Promise<string[]>;

  // App Context
  getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null>;
}
