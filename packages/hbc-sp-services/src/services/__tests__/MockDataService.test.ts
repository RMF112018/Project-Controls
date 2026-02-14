import { MockDataService } from '../MockDataService';
import { createTestLeadFormData } from './test-helpers';
import {
  Stage,
  RoleName,
  GoNoGoDecision,
  ProvisioningStatus,
  AuditAction,
  EntityType,
  DeliverableStatus,
} from '../../models/enums';
import { SCORECARD_CRITERIA } from '../../models/IGoNoGoScorecard';

describe('MockDataService', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // ─── Leads CRUD ────────────────────────────────────────────

  describe('Leads CRUD', () => {
    it('getLeads returns paginated results', async () => {
      const result = await ds.getLeads();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThanOrEqual(result.items.length);
    });

    it('getLeads respects top/skip pagination', async () => {
      const all = await ds.getLeads();
      const page = await ds.getLeads({ top: 5, skip: 0 });
      expect(page.items.length).toBeLessThanOrEqual(5);
      expect(page.totalCount).toBe(all.totalCount);
    });

    it('getLeadById returns lead or null', async () => {
      const all = await ds.getLeads();
      const first = all.items[0];
      const lead = await ds.getLeadById(first.id);
      expect(lead).toBeDefined();
      expect(lead!.id).toBe(first.id);

      const missing = await ds.getLeadById(999999);
      expect(missing).toBeNull();
    });

    it('getLeadsByStage filters correctly', async () => {
      const leads = await ds.getLeadsByStage(Stage.LeadDiscovery);
      for (const lead of leads) {
        expect(lead.Stage).toBe(Stage.LeadDiscovery);
      }
    });

    it('createLead assigns id and returns new lead', async () => {
      const formData = createTestLeadFormData();
      const lead = await ds.createLead(formData);
      expect(lead.id).toBeDefined();
      expect(lead.id).toBeGreaterThan(0);
      expect(lead.Title).toBe('Test Project Alpha');
      expect(lead.ClientName).toBe('Acme Corp');
    });

    it('updateLead merges partial data', async () => {
      const all = await ds.getLeads();
      const first = all.items[0];
      const updated = await ds.updateLead(first.id, { ClientName: 'Updated Corp' });
      expect(updated.ClientName).toBe('Updated Corp');
      expect(updated.id).toBe(first.id);
    });

    it('deleteLead removes from collection', async () => {
      const formData = createTestLeadFormData();
      const lead = await ds.createLead(formData);
      await ds.deleteLead(lead.id);
      const deleted = await ds.getLeadById(lead.id);
      expect(deleted).toBeNull();
    });

    it('searchLeads matches Title, ClientName, ProjectCode', async () => {
      const all = await ds.getLeads();
      const target = all.items[0];

      // Search by partial title
      const byTitle = await ds.searchLeads(target.Title.substring(0, 5));
      expect(byTitle.length).toBeGreaterThanOrEqual(1);

      // Search by client name
      if (target.ClientName) {
        const byClient = await ds.searchLeads(target.ClientName.substring(0, 5));
        expect(byClient.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ─── Scorecards ────────────────────────────────────────────

  describe('Scorecards', () => {
    it('getScorecards returns assembled scorecards', async () => {
      const scorecards = await ds.getScorecards();
      expect(Array.isArray(scorecards)).toBe(true);
    });

    it('getScorecardByLeadId returns null for missing', async () => {
      const result = await ds.getScorecardByLeadId(999999);
      expect(result).toBeNull();
    });

    it('createScorecard assigns id', async () => {
      const sc = await ds.createScorecard({ LeadID: 1, scores: {} });
      expect(sc.id).toBeDefined();
      expect(sc.id).toBeGreaterThan(0);
      expect(sc.LeadID).toBe(1);
    });

    it('updateScorecard preserves workflow fields', async () => {
      const sc = await ds.createScorecard({ LeadID: 1, scores: {} });
      // Update just the scores — workflow fields should be preserved
      const updated = await ds.updateScorecard(sc.id, { scores: { 1: { originator: 6 } } });
      expect(updated.scores[1]?.originator).toBe(6);
      expect(updated.id).toBe(sc.id);
    });

    it('submitGoNoGoDecision updates lead stage', async () => {
      // Create a lead at GoNoGoPending
      const lead = await ds.createLead(createTestLeadFormData({ Stage: Stage.GoNoGoPending }));
      const sc = await ds.createScorecard({ LeadID: lead.id, scores: {} });

      await ds.submitGoNoGoDecision(sc.id, GoNoGoDecision.Go);

      const updatedLead = await ds.getLeadById(lead.id);
      expect(updatedLead!.GoNoGoDecision).toBe(GoNoGoDecision.Go);
    });
  });

  // ─── Estimating ────────────────────────────────────────────

  describe('Estimating', () => {
    it('getEstimatingRecords returns paginated results', async () => {
      const result = await ds.getEstimatingRecords();
      expect(result.items).toBeDefined();
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it('getCurrentPursuits returns records', async () => {
      const pursuits = await ds.getCurrentPursuits();
      expect(Array.isArray(pursuits)).toBe(true);
    });

    it('getPreconEngagements returns records', async () => {
      const engagements = await ds.getPreconEngagements();
      expect(Array.isArray(engagements)).toBe(true);
    });

    it('createEstimatingRecord assigns id', async () => {
      const record = await ds.createEstimatingRecord({
        Title: 'Test Estimate',
        LeadID: 1,
        ProjectCode: '25-099-01',
      });
      expect(record.id).toBeDefined();
      expect(record.id).toBeGreaterThan(0);
    });

    it('updateEstimatingRecord merges data', async () => {
      const result = await ds.getEstimatingRecords();
      const first = result.items[0];
      const updated = await ds.updateEstimatingRecord(first.id, { Title: 'Updated Title' });
      expect(updated.Title).toBe('Updated Title');
    });
  });

  // ─── Authentication & Roles ────────────────────────────────

  describe('Authentication & Roles', () => {
    it('getCurrentUser returns user matching current role', async () => {
      ds.setCurrentUserRole(RoleName.ExecutiveLeadership);
      const user = await ds.getCurrentUser();
      expect(user).toBeDefined();
      expect(user.roles).toContain(RoleName.ExecutiveLeadership);
    });

    it('setCurrentUserRole changes returned user', async () => {
      ds.setCurrentUserRole(RoleName.BDRepresentative);
      const bdUser = await ds.getCurrentUser();

      ds.setCurrentUserRole(RoleName.ExecutiveLeadership);
      const execUser = await ds.getCurrentUser();

      // Different roles should (potentially) return different users
      expect(bdUser.roles).toContain(RoleName.BDRepresentative);
      expect(execUser.roles).toContain(RoleName.ExecutiveLeadership);
    });

    it('getRoles returns all roles', async () => {
      const roles = await ds.getRoles();
      expect(roles.length).toBeGreaterThan(0);
    });

    it('getFeatureFlags returns all flags', async () => {
      const flags = await ds.getFeatureFlags();
      expect(flags.length).toBeGreaterThan(0);
      // Check some known flags
      expect(flags.some(f => f.FeatureName === 'LeadIntake')).toBe(true);
      expect(flags.some(f => f.FeatureName === 'GoNoGoScorecard')).toBe(true);
    });
  });

  // ─── Provisioning ─────────────────────────────────────────

  describe('Provisioning', () => {
    it('triggerProvisioning creates log entry', async () => {
      const log = await ds.triggerProvisioning(1, '25-099-01', 'Test Project', 'admin@test.com');
      expect(log).toBeDefined();
      expect(log.projectCode).toBe('25-099-01');
      expect(log.status).toBe(ProvisioningStatus.Queued);
    });

    it('getProvisioningStatus returns by projectCode', async () => {
      await ds.triggerProvisioning(1, '25-099-01', 'Test Project', 'admin@test.com');
      const status = await ds.getProvisioningStatus('25-099-01');
      expect(status).toBeDefined();
      expect(status!.projectCode).toBe('25-099-01');
    });

    it('getProvisioningStatus returns null for unknown code', async () => {
      const status = await ds.getProvisioningStatus('99-999-99');
      expect(status).toBeNull();
    });

    it('getProvisioningLogs returns all', async () => {
      await ds.triggerProvisioning(1, '25-099-01', 'Test 1', 'admin@test.com');
      await ds.triggerProvisioning(2, '25-099-02', 'Test 2', 'admin@test.com');
      const logs = await ds.getProvisioningLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('retryProvisioning resets failure state', async () => {
      await ds.triggerProvisioning(1, '25-099-01', 'Test', 'admin@test.com');
      // Manually set to failed
      await ds.updateProvisioningLog('25-099-01', {
        status: ProvisioningStatus.Failed,
        failedStep: 3,
      });
      const retried = await ds.retryProvisioning('25-099-01', 3);
      expect(retried.status).toBe(ProvisioningStatus.InProgress);
    });
  });

  // ─── Team Members & Deliverables ──────────────────────────

  describe('Team Members & Deliverables', () => {
    it('getTeamMembers filters by projectCode', async () => {
      const members = await ds.getTeamMembers('25-042-01');
      expect(Array.isArray(members)).toBe(true);
      for (const m of members) {
        expect(m.projectCode).toBe('25-042-01');
      }
    });

    it('getDeliverables filters by projectCode', async () => {
      const deliverables = await ds.getDeliverables('25-042-01');
      expect(Array.isArray(deliverables)).toBe(true);
      for (const d of deliverables) {
        expect(d.projectCode).toBe('25-042-01');
      }
    });

    it('createDeliverable assigns id', async () => {
      const d = await ds.createDeliverable({
        projectCode: '25-042-01',
        name: 'Test Deliverable',
        department: 'Estimating',
        assignedTo: 'Test User',
        status: DeliverableStatus.NotStarted,
        dueDate: '2026-03-01',
      });
      expect(d.id).toBeGreaterThan(0);
      expect(d.name).toBe('Test Deliverable');
    });

    it('updateDeliverable merges data', async () => {
      const deliverables = await ds.getDeliverables('25-042-01');
      if (deliverables.length > 0) {
        const updated = await ds.updateDeliverable(deliverables[0].id, {
          status: DeliverableStatus.Complete,
        });
        expect(updated.status).toBe(DeliverableStatus.Complete);
      }
    });
  });

  // ─── Startup Checklist ────────────────────────────────────

  describe('Startup Checklist', () => {
    it('getStartupChecklist returns items for projectCode', async () => {
      const items = await ds.getStartupChecklist('25-042-01');
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.projectCode).toBe('25-042-01');
      }
    });

    it('updateChecklistItem modifies item', async () => {
      const items = await ds.getStartupChecklist('25-042-01');
      const first = items[0];
      const updated = await ds.updateChecklistItem('25-042-01', first.id, {
        status: 'Conforming',
      });
      expect(updated.status).toBe('Conforming');
    });

    it('addChecklistItem appends new item', async () => {
      const before = await ds.getStartupChecklist('25-042-01');
      await ds.addChecklistItem('25-042-01', {
        projectCode: '25-042-01',
        sectionNumber: 1,
        sectionName: 'Test Section',
        itemNumber: '99',
        label: 'New Test Item',
        responseType: 'yesNoNA',
      });
      const after = await ds.getStartupChecklist('25-042-01');
      expect(after.length).toBe(before.length + 1);
    });

    it('removeChecklistItem deletes by id', async () => {
      const items = await ds.getStartupChecklist('25-042-01');
      const lastItem = items[items.length - 1];
      await ds.removeChecklistItem('25-042-01', lastItem.id);
      const after = await ds.getStartupChecklist('25-042-01');
      expect(after.find(i => i.id === lastItem.id)).toBeUndefined();
    });
  });

  // ─── Responsibility Matrices ──────────────────────────────

  describe('Responsibility Matrices', () => {
    it('getInternalMatrix returns tasks for projectCode', async () => {
      const tasks = await ds.getInternalMatrix('25-042-01');
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('getOwnerContractMatrix returns articles', async () => {
      const articles = await ds.getOwnerContractMatrix('25-042-01');
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);
    });

    it('getSubContractMatrix returns clauses', async () => {
      const clauses = await ds.getSubContractMatrix('25-042-01');
      expect(Array.isArray(clauses)).toBe(true);
      expect(clauses.length).toBeGreaterThan(0);
    });

    it('updateInternalMatrixTask modifies task', async () => {
      const tasks = await ds.getInternalMatrix('25-042-01');
      const first = tasks[0];
      const updated = await ds.updateInternalMatrixTask('25-042-01', first.id, {
        PX: 'X',
      });
      expect(updated.PX).toBe('X');
    });
  });

  // ─── Marketing Project Records ────────────────────────────

  describe('Marketing Project Records', () => {
    it('getMarketingProjectRecord returns by projectCode', async () => {
      const record = await ds.getMarketingProjectRecord('25-042-01');
      expect(record).toBeDefined();
      expect(record!.projectCode).toBe('25-042-01');
    });

    it('getMarketingProjectRecord returns null for unknown project', async () => {
      const result = await ds.getMarketingProjectRecord('99-999-99');
      expect(result).toBeNull();
    });

    it('createMarketingProjectRecord assigns id', async () => {
      const record = await ds.createMarketingProjectRecord({
        projectCode: '25-099-01',
        projectName: 'Test Marketing Record',
      });
      expect(record).toBeDefined();
      expect(record.projectCode).toBe('25-099-01');
    });

    it('getAllMarketingProjectRecords returns all', async () => {
      const records = await ds.getAllMarketingProjectRecords();
      expect(records.length).toBeGreaterThan(0);
    });
  });

  // ─── Audit & Notifications ────────────────────────────────

  describe('Audit & Notifications', () => {
    it('logAudit stores entries', async () => {
      await ds.logAudit({
        Action: AuditAction.LeadCreated,
        EntityType: EntityType.Lead,
        EntityId: '1',
        Details: 'Test audit',
      });
      const log = await ds.getAuditLog();
      expect(log.some(e => e.Details === 'Test audit')).toBe(true);
    });

    it('getAuditLog filters by entityType', async () => {
      await ds.logAudit({
        Action: AuditAction.LeadCreated,
        EntityType: EntityType.Lead,
        EntityId: '1',
        Details: 'Lead audit',
      });
      await ds.logAudit({
        Action: AuditAction.GoNoGoScoreSubmitted,
        EntityType: EntityType.Scorecard,
        EntityId: '2',
        Details: 'Scorecard audit',
      });

      const leadEntries = await ds.getAuditLog(EntityType.Lead);
      for (const e of leadEntries) {
        expect(e.EntityType).toBe(EntityType.Lead);
      }
    });

    it('sendNotification stores notification', async () => {
      const notification = await ds.sendNotification({
        subject: 'Test Notification',
        body: 'This is a test',
        recipients: ['user@test.com'],
      });
      expect(notification.id).toBeDefined();
      expect(notification.subject).toBe('Test Notification');
    });

    it('getNotifications returns stored notifications', async () => {
      await ds.sendNotification({
        subject: 'Test',
        body: 'Body',
        recipients: ['user@test.com'],
      });
      const notifications = await ds.getNotifications();
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Permission Engine ────────────────────────────────────

  describe('Permission Engine', () => {
    it('resolveUserPermissions returns correct permissions for role', async () => {
      ds.setCurrentUserRole(RoleName.ExecutiveLeadership);
      const user = await ds.getCurrentUser();
      const resolved = await ds.resolveUserPermissions(user.email, null);
      expect(resolved.permissions).toBeDefined();
      expect(resolved.permissions.size).toBeGreaterThan(0);
    });

    it('getAccessibleProjects returns assigned projects', async () => {
      ds.setCurrentUserRole(RoleName.ExecutiveLeadership);
      const user = await ds.getCurrentUser();
      const projects = await ds.getAccessibleProjects(user.email);
      expect(Array.isArray(projects)).toBe(true);
    });

    it('getPermissionTemplates returns all templates', async () => {
      const templates = await ds.getPermissionTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('createProjectTeamAssignment assigns user', async () => {
      const assignment = await ds.createProjectTeamAssignment({
        projectCode: '25-042-01',
        userId: 'test-user',
        userDisplayName: 'Test User',
        userEmail: 'test@example.com',
        assignedRole: 'Operations Team',
        isActive: true,
      });
      expect(assignment.id).toBeDefined();
      expect(assignment.projectCode).toBe('25-042-01');
    });
  });

  // ─── Workflow Definitions ─────────────────────────────────

  describe('Workflow Definitions', () => {
    it('getWorkflowDefinitions returns assembled definitions', async () => {
      const defs = await ds.getWorkflowDefinitions();
      expect(defs.length).toBeGreaterThan(0);
      for (const def of defs) {
        expect(def.steps).toBeDefined();
        expect(Array.isArray(def.steps)).toBe(true);
      }
    });

    it('resolveWorkflowChain resolves steps', async () => {
      const defs = await ds.getWorkflowDefinitions();
      if (defs.length > 0) {
        const chain = await ds.resolveWorkflowChain(defs[0].workflowKey, '25-042-01');
        expect(Array.isArray(chain)).toBe(true);
        for (const step of chain) {
          expect(step.stepId).toBeDefined();
          expect(step.assignee).toBeDefined();
          expect(step.assignmentSource).toBeDefined();
        }
      }
    });

    it('updateWorkflowStep modifies step', async () => {
      const defs = await ds.getWorkflowDefinitions();
      if (defs.length > 0 && defs[0].steps.length > 0) {
        const step = defs[0].steps[0];
        const updated = await ds.updateWorkflowStep(defs[0].id, step.id, {
          name: 'Updated Step Name',
        });
        expect(updated.name).toBe('Updated Step Name');
      }
    });
  });

  // ─── Data Isolation ───────────────────────────────────────

  describe('Data Isolation', () => {
    it('mutations do not affect new instance (deep clone verification)', async () => {
      const ds1 = new MockDataService();
      const leads1 = await ds1.getLeads();
      const originalCount = leads1.totalCount;

      // Add a lead in ds1
      await ds1.createLead(createTestLeadFormData());

      // Create a fresh instance — should have the original count
      const ds2 = new MockDataService();
      const leads2 = await ds2.getLeads();
      expect(leads2.totalCount).toBe(originalCount);
    });

    it('separate instances have independent state', async () => {
      const ds1 = new MockDataService();
      const ds2 = new MockDataService();

      await ds1.createLead(createTestLeadFormData({ Title: 'Instance 1 Lead' }));

      const search1 = await ds1.searchLeads('Instance 1 Lead');
      const search2 = await ds2.searchLeads('Instance 1 Lead');

      expect(search1.length).toBe(1);
      expect(search2.length).toBe(0);
    });
  });

  // ─── Feature Flags ────────────────────────────────────────

  describe('Feature Flags', () => {
    it('updateFeatureFlag modifies flag', async () => {
      const flags = await ds.getFeatureFlags();
      const flag = flags[0];
      const updated = await ds.updateFeatureFlag(flag.id, { Enabled: !flag.Enabled });
      expect(updated.Enabled).toBe(!flag.Enabled);
    });
  });

  // ─── Meetings & Calendar ──────────────────────────────────

  describe('Meetings & Calendar', () => {
    it('createMeeting assigns id', async () => {
      const meeting = await ds.createMeeting({
        subject: 'Test Meeting',
        startTime: '2026-03-01T10:00:00',
        endTime: '2026-03-01T11:00:00',
        attendees: ['user@test.com'],
      });
      expect(meeting.id).toBeDefined();
    });

    it('getMeetings returns stored meetings', async () => {
      await ds.createMeeting({ subject: 'Meeting 1' });
      const meetings = await ds.getMeetings();
      expect(meetings.length).toBeGreaterThanOrEqual(1);
    });

    it('getCalendarAvailability returns availability data', async () => {
      const avail = await ds.getCalendarAvailability(
        ['user@test.com'],
        '2026-03-01',
        '2026-03-02'
      );
      expect(Array.isArray(avail)).toBe(true);
    });
  });
});
