import { IDataService } from './IDataService';
import { INotification, NotificationType, NotificationEvent } from '../models';

export interface INotificationContext {
  leadTitle?: string;
  leadId?: number;
  projectCode?: string;
  clientName?: string;
  decision?: string;
  score?: number;
  meetingDate?: string;
  dueDate?: string;
  deliverableName?: string;
  outcome?: string;
  siteUrl?: string;
  scheduledBy?: string;
  jobNumber?: string;
  assignedBy?: string;
  processScore?: number;
  overallRating?: number;
}

interface INotificationTemplate {
  subject: string;
  body: string;
  type: NotificationType;
  recipientRoles: string[];
}

function buildTemplate(
  event: NotificationEvent,
  ctx: INotificationContext
): INotificationTemplate {
  switch (event) {
    case NotificationEvent.LeadSubmitted:
      return {
        subject: `New Lead Submitted: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A new lead "${ctx.leadTitle}" for client ${ctx.clientName ?? 'Unknown'} has been submitted and is awaiting Go/No-Go evaluation.`,
        type: NotificationType.Both,
        recipientRoles: ['Executive Leadership', 'Estimating Coordinator'],
      };

    case NotificationEvent.GoNoGoScoringRequested:
      return {
        subject: `Go/No-Go Scoring Requested: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A Go/No-Go scorecard has been created for "${ctx.leadTitle}" (${ctx.clientName ?? ''}). Committee members are requested to complete their scoring.`,
        type: NotificationType.Both,
        recipientRoles: ['Executive Leadership'],
      };

    case NotificationEvent.GoNoGoDecisionMade:
      return {
        subject: `Go/No-Go Decision: ${ctx.decision ?? 'Pending'} — ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go committee has made a "${ctx.decision}" decision for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).${ctx.score !== undefined ? ` Final score: ${ctx.score}/92.` : ''}${ctx.projectCode ? ` Project code: ${ctx.projectCode}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Executive Leadership', 'Estimating Coordinator', 'Preconstruction Team'],
      };

    case NotificationEvent.SiteProvisioned:
      return {
        subject: `Project Site Provisioned: ${ctx.projectCode ?? ''}`,
        body: `A SharePoint project site has been provisioned for "${ctx.leadTitle}" (${ctx.projectCode ?? ''}).${ctx.siteUrl ? ` Site URL: ${ctx.siteUrl}` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Executive Leadership', 'Operations Team', 'Preconstruction Team'],
      };

    case NotificationEvent.PreconKickoff:
      return {
        subject: `Precon Kickoff Scheduled: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A preconstruction kickoff meeting has been scheduled for "${ctx.leadTitle}" (${ctx.projectCode ?? ''}).${ctx.meetingDate ? ` Date: ${ctx.meetingDate}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Estimating Coordinator', 'Preconstruction Team', 'Executive Leadership'],
      };

    case NotificationEvent.DeliverableDueApproaching:
      return {
        subject: `Deliverable Due Soon: ${ctx.deliverableName ?? 'Untitled'}`,
        body: `The deliverable "${ctx.deliverableName}" for project ${ctx.projectCode ?? ''} is due on ${ctx.dueDate ?? 'TBD'}.`,
        type: NotificationType.Email,
        recipientRoles: ['Estimating Coordinator', 'Preconstruction Team'],
      };

    case NotificationEvent.WinLossRecorded:
      return {
        subject: `${ctx.outcome ?? 'Win/Loss'} Recorded: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A "${ctx.outcome}" outcome has been recorded for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Executive Leadership', 'Marketing'],
      };

    case NotificationEvent.AutopsyScheduled:
      return {
        subject: `Loss Autopsy Scheduled: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A loss autopsy meeting has been scheduled for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).${ctx.meetingDate ? ` Date: ${ctx.meetingDate}.` : ''}${ctx.scheduledBy ? ` Scheduled by: ${ctx.scheduledBy}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Executive Leadership', 'Estimating Coordinator'],
      };

    case NotificationEvent.TurnoverCompleted:
      return {
        subject: `Turnover Completed: ${ctx.projectCode ?? ''}`,
        body: `Project turnover has been completed for ${ctx.projectCode ?? 'Unknown project'} ("${ctx.leadTitle ?? ''}").`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Executive Leadership', 'Operations Team'],
      };

    case NotificationEvent.SafetyFolderChanged:
      return {
        subject: `Safety Folder Updated: ${ctx.projectCode ?? ''}`,
        body: `The safety folder for project ${ctx.projectCode ?? ''} has been updated.`,
        type: NotificationType.Email,
        recipientRoles: ['Safety', 'Operations Team'],
      };

    case NotificationEvent.JobNumberRequested:
      return {
        subject: `New Job Number Request: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A new job number has been requested for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).${ctx.dueDate ? ` Required by: ${ctx.dueDate}.` : ''} Please review in the Accounting Queue.`,
        type: NotificationType.Both,
        // Standard Distribution: hardcoded to Heather Thomas + Accounting Manager role
        recipientRoles: ['Accounting Manager'],
      };

    case NotificationEvent.JobNumberAssigned:
      return {
        subject: `Job Number Assigned: ${ctx.projectCode ?? ''} — ${ctx.leadTitle ?? 'Untitled'}`,
        body: `Official job number ${ctx.projectCode ?? ''} has been assigned to "${ctx.leadTitle}" (${ctx.clientName ?? ''}). The project code has been updated across all records.`,
        type: NotificationType.Both,
        recipientRoles: ['Estimating Coordinator', 'BD Representative', 'Executive Leadership'],
      };

    case NotificationEvent.EstimatingKickoffScheduled:
      return {
        subject: `Estimating Kick-Off Scheduled: ${ctx.projectCode ?? ''}`,
        body: `An estimating kick-off meeting has been scheduled for "${ctx.leadTitle ?? 'Untitled'}" (${ctx.projectCode ?? ''}).`,
        type: NotificationType.Both,
        recipientRoles: ['Estimating Coordinator', 'Executive Leadership'],
      };

    case NotificationEvent.AutopsyFinalized:
      return {
        subject: `Post-Bid Autopsy Finalized: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Post-Bid Autopsy for "${ctx.leadTitle ?? 'Untitled'}" (${ctx.clientName ?? ''}) has been finalized.${ctx.processScore !== undefined ? ` Process Score: ${ctx.processScore}%.` : ''}${ctx.overallRating !== undefined ? ` Overall Rating: ${ctx.overallRating}/10.` : ''} Lessons Learned have been updated. Archive is now unlocked.`,
        type: NotificationType.Both,
        recipientRoles: ['BD Representative', 'Executive Leadership', 'Estimating Coordinator', 'Preconstruction Team'],
      };

    default:
      return {
        subject: `Notification: ${event}`,
        body: `A notification event (${event}) occurred for project ${ctx.projectCode ?? ''}.`,
        type: NotificationType.Email,
        recipientRoles: ['Operations Team'],
      };
  }
}

export class NotificationService {
  private dataService: IDataService;
  private usersByRole: Map<string, string[]> | undefined;

  constructor(dataService: IDataService) {
    this.dataService = dataService;
  }

  /**
   * Lazily load user-role mapping from the data service.
   */
  private async getUsersByRole(): Promise<Map<string, string[]>> {
    if (this.usersByRole) {
      return this.usersByRole;
    }

    const roles = await this.dataService.getRoles();
    const map = new Map<string, string[]>();
    for (const role of roles) {
      map.set(role.Title, role.UserOrGroup ?? []);
    }
    this.usersByRole = map;
    return map;
  }

  /**
   * Resolve email recipients from a list of role names.
   */
  private async resolveRecipients(roleNames: string[]): Promise<string[]> {
    const roleMap = await this.getUsersByRole();
    const emailSet = new Set<string>();

    for (const roleName of roleNames) {
      const emails = roleMap.get(roleName) ?? [];
      for (const email of emails) {
        emailSet.add(email);
      }
    }

    return Array.from(emailSet);
  }

  /**
   * Send a notification for a given event. Fire-and-forget safe — returns
   * the created notification or undefined if it fails silently.
   */
  public async notify(
    event: NotificationEvent,
    ctx: INotificationContext,
    sentBy: string
  ): Promise<INotification | undefined> {
    const template = buildTemplate(event, ctx);
    const recipients = await this.resolveRecipients(template.recipientRoles);

    if (recipients.length === 0) {
      return undefined;
    }

    const notification = await this.dataService.sendNotification({
      type: template.type,
      subject: template.subject,
      body: template.body,
      recipients,
      sentBy,
      relatedEntityType: ctx.leadId !== undefined ? 'Lead' : ctx.projectCode ? 'Project' : undefined,
      relatedEntityId: ctx.leadId !== undefined ? String(ctx.leadId) : ctx.projectCode,
      projectCode: ctx.projectCode,
    });

    return notification;
  }
}
