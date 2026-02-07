import { IDataService, IListQueryOptions, IPagedResult } from './IDataService';
import { ILead, ILeadFormData } from '../models/ILead';
import { IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
import { IEstimatingTracker } from '../models/IEstimatingTracker';
import { IRole, ICurrentUser } from '../models/IRole';
import { IFeatureFlag } from '../models/IFeatureFlag';
import { IMeeting, ICalendarAvailability } from '../models/IMeeting';
import { INotification } from '../models/INotification';
import { IAuditEntry } from '../models/IAuditEntry';
import { GoNoGoDecision, Stage } from '../models/enums';
import { LIST_NAMES } from '../utils/constants';

/**
 * SharePoint Data Service — Live implementation using PnP JS.
 *
 * This is a stub. Each method will be implemented when connecting
 * to real SharePoint lists. For development, use MockDataService.
 */
export class SharePointDataService implements IDataService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sp: any; // SPFI instance

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(spInstance: any): void {
    this.sp = spInstance;
  }

  // --- Leads ---
  async getLeads(_options?: IListQueryOptions): Promise<IPagedResult<ILead>> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .top(_options?.top || 100)();
    return { items: items as ILead[], totalCount: items.length, hasMore: false };
  }

  async getLeadById(id: number): Promise<ILead | null> {
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id)();
      return item as ILead;
    } catch {
      return null;
    }
  }

  async getLeadsByStage(stage: Stage): Promise<ILead[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .filter(`Stage eq '${stage}'`)();
    return items as ILead[];
  }

  async createLead(data: ILeadFormData): Promise<ILead> {
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.add(data);
    return result as ILead;
  }

  async updateLead(id: number, data: Partial<ILead>): Promise<ILead> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id).update(data);
    return this.getLeadById(id) as Promise<ILead>;
  }

  async deleteLead(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items.getById(id).delete();
  }

  async searchLeads(query: string): Promise<ILead[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.LEADS_MASTER).items
      .filter(`substringof('${query}', Title) or substringof('${query}', ClientName) or substringof('${query}', ProjectCode)`)();
    return items as ILead[];
  }

  // --- Scorecards ---
  async getScorecardByLeadId(leadId: number): Promise<IGoNoGoScorecard | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items
      .filter(`LeadID eq ${leadId}`)();
    return items.length > 0 ? items[0] as IGoNoGoScorecard : null;
  }

  async getScorecards(): Promise<IGoNoGoScorecard[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items();
    return items as IGoNoGoScorecard[];
  }

  async createScorecard(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.add(data);
    return result as IGoNoGoScorecard;
  }

  async updateScorecard(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.GONOGO_SCORECARD).items.getById(id).update(data);
    return { id, ...data } as IGoNoGoScorecard;
  }

  async submitGoNoGoDecision(scorecardId: number, decision: GoNoGoDecision, projectCode?: string): Promise<void> {
    await this.updateScorecard(scorecardId, {
      Decision: decision,
      DecisionDate: new Date().toISOString(),
      ProjectCode: projectCode,
    });
  }

  // --- Estimating ---
  async getEstimatingRecords(_options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items();
    return { items: items as IEstimatingTracker[], totalCount: items.length, hasMore: false };
  }

  async getEstimatingRecordById(id: number): Promise<IEstimatingTracker | null> {
    try {
      const item = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.getById(id)();
      return item as IEstimatingTracker;
    } catch {
      return null;
    }
  }

  async getEstimatingByLeadId(leadId: number): Promise<IEstimatingTracker | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`LeadID eq ${leadId}`)();
    return items.length > 0 ? items[0] as IEstimatingTracker : null;
  }

  async createEstimatingRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    const result = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.add(data);
    return result as IEstimatingTracker;
  }

  async updateEstimatingRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items.getById(id).update(data);
    return { id, ...data } as IEstimatingTracker;
  }

  async getCurrentPursuits(): Promise<IEstimatingTracker[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`AwardStatus eq 'Pending'`)();
    return items as IEstimatingTracker[];
  }

  async getPreconEngagements(): Promise<IEstimatingTracker[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`AwardStatus eq 'Awarded w/ Precon'`)();
    return items as IEstimatingTracker[];
  }

  async getEstimateLog(): Promise<IEstimatingTracker[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.ESTIMATING_TRACKER).items
      .filter(`SubmittedDate ne null`)();
    return items as IEstimatingTracker[];
  }

  // --- RBAC ---
  async getCurrentUser(): Promise<ICurrentUser> {
    // Will be populated from SPFx context + App_Roles
    throw new Error('Not implemented - use SPFx context');
  }

  async getRoles(): Promise<IRole[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_ROLES).items();
    return items as IRole[];
  }

  async updateRole(id: number, data: Partial<IRole>): Promise<IRole> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.APP_ROLES).items.getById(id).update(data);
    return { id, ...data } as IRole;
  }

  // --- Feature Flags ---
  async getFeatureFlags(): Promise<IFeatureFlag[]> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.FEATURE_FLAGS).items();
    return items as IFeatureFlag[];
  }

  async updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.FEATURE_FLAGS).items.getById(id).update(data);
    return { id, ...data } as IFeatureFlag;
  }

  // --- Meetings ---
  async getCalendarAvailability(_emails: string[], _startDate: string, _endDate: string): Promise<ICalendarAvailability[]> {
    // Delegated to GraphService
    throw new Error('Use GraphService directly');
  }

  async createMeeting(_meeting: Partial<IMeeting>): Promise<IMeeting> {
    throw new Error('Use GraphService directly');
  }

  async getMeetings(_projectCode?: string): Promise<IMeeting[]> {
    return [];
  }

  // --- Notifications ---
  async sendNotification(_notification: Partial<INotification>): Promise<INotification> {
    throw new Error('Use PowerAutomateService directly');
  }

  async getNotifications(_projectCode?: string): Promise<INotification[]> {
    return [];
  }

  // --- Audit ---
  async logAudit(entry: Partial<IAuditEntry>): Promise<void> {
    await this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items.add(entry);
  }

  async getAuditLog(entityType?: string, entityId?: string): Promise<IAuditEntry[]> {
    let query = this.sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items;
    const filters: string[] = [];
    if (entityType) filters.push(`EntityType eq '${entityType}'`);
    if (entityId) filters.push(`EntityId eq '${entityId}'`);
    if (filters.length > 0) query = query.filter(filters.join(' and '));
    const items = await query.orderBy('Timestamp', false).top(100)();
    return items as IAuditEntry[];
  }

  // --- Provisioning ---
  async triggerProvisioning(_leadId: number, _projectCode: string): Promise<{ status: string; logId: number }> {
    // Delegated to PowerAutomateService
    throw new Error('Use PowerAutomateService directly');
  }

  async getProvisioningStatus(projectCode: string): Promise<{ status: string; step: number; error?: string }> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.PROVISIONING_LOG).items
      .filter(`ProjectCode eq '${projectCode}'`)
      .orderBy('RequestedAt', false)
      .top(1)();
    if (items.length === 0) return { status: 'NotFound', step: 0 };
    return { status: items[0].Status, step: items[0].StepCompleted || 0, error: items[0].ErrorMessage };
  }

  async retryProvisioning(_projectCode: string, _fromStep: number): Promise<void> {
    // Delegated to PowerAutomateService
    throw new Error('Use PowerAutomateService directly');
  }

  // --- App Context ---
  async getAppContextConfig(siteUrl: string): Promise<{ RenderMode: string; AppTitle: string; VisibleModules: string[] } | null> {
    const items = await this.sp.web.lists.getByTitle(LIST_NAMES.APP_CONTEXT_CONFIG).items
      .filter(`SiteURL eq '${siteUrl}'`)();
    if (items.length === 0) return null;
    return {
      RenderMode: items[0].RenderMode,
      AppTitle: items[0].AppTitle,
      VisibleModules: JSON.parse(items[0].VisibleModules || '[]'),
    };
  }
}
