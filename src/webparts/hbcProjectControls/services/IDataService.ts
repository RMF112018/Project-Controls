import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { IProvisioningLog } from '../models/IProvisioningLog';
import { IDeliverable } from '../models/IDeliverable';
import { ITeamMember } from '../models/ITeamMember';
import { IInterviewPrep } from '../models/IInterviewPrep';
import { IContractInfo } from '../models/IContractInfo';
import { ITurnoverItem } from '../models/ITurnoverItem';
import { ICloseoutItem } from '../models/ICloseoutItem';
import { ILossAutopsy } from '../models/ILossAutopsy';
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

  // Phase 6 — Workflow
  getTeamMembers(projectCode: string): Promise<ITeamMember[]>;
  getDeliverables(projectCode: string): Promise<IDeliverable[]>;
  createDeliverable(data: Partial<IDeliverable>): Promise<IDeliverable>;
  updateDeliverable(id: number, data: Partial<IDeliverable>): Promise<IDeliverable>;
  getInterviewPrep(leadId: number): Promise<IInterviewPrep | null>;
  saveInterviewPrep(data: Partial<IInterviewPrep>): Promise<IInterviewPrep>;
  getContractInfo(projectCode: string): Promise<IContractInfo | null>;
  saveContractInfo(data: Partial<IContractInfo>): Promise<IContractInfo>;
  getTurnoverItems(projectCode: string): Promise<ITurnoverItem[]>;
  updateTurnoverItem(id: number, data: Partial<ITurnoverItem>): Promise<ITurnoverItem>;
  getCloseoutItems(projectCode: string): Promise<ICloseoutItem[]>;
  updateCloseoutItem(id: number, data: Partial<ICloseoutItem>): Promise<ICloseoutItem>;
  getLossAutopsy(leadId: number): Promise<ILossAutopsy | null>;
  saveLossAutopsy(data: Partial<ILossAutopsy>): Promise<ILossAutopsy>;

  // App Context
  getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null>;
}
