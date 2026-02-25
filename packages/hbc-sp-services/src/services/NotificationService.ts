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
  divisionDescription?: string;
  contractValue?: number;
  waiverType?: string;
  approverName?: string;
  submittedBy?: string;
  returnComment?: string;
  committeeTotal?: number;
  unlockedBy?: string;
  reason?: string;
  comment?: string;
  conditions?: string;
  decisionDate?: string;
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
        recipientRoles: ['Leadership', 'Estimator'],
      };

    case NotificationEvent.GoNoGoScoringRequested:
      return {
        subject: `Go/No-Go Scoring Requested: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A Go/No-Go scorecard has been created for "${ctx.leadTitle}" (${ctx.clientName ?? ''}). Committee members are requested to complete their scoring.`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership'],
      };

    case NotificationEvent.GoNoGoDecisionMade:
      return {
        subject: `Go/No-Go Decision: ${ctx.decision ?? 'Pending'} — ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go committee has made a "${ctx.decision}" decision for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).${ctx.score !== undefined ? ` Final score: ${ctx.score}/92.` : ''}${ctx.projectCode ? ` Project code: ${ctx.projectCode}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Estimator', 'Preconstruction Manager'],
      };

    case NotificationEvent.SiteProvisioned:
      return {
        subject: `Project Site Provisioned: ${ctx.projectCode ?? ''}`,
        body: `A SharePoint project site has been provisioned for "${ctx.leadTitle}" (${ctx.projectCode ?? ''}).${ctx.siteUrl ? ` Site URL: ${ctx.siteUrl}` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Commercial Operations Manager', 'Preconstruction Manager'],
      };

    case NotificationEvent.PreconKickoff:
      return {
        subject: `Precon Kickoff Scheduled: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A preconstruction kickoff meeting has been scheduled for "${ctx.leadTitle}" (${ctx.projectCode ?? ''}).${ctx.meetingDate ? ` Date: ${ctx.meetingDate}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Estimator', 'Preconstruction Manager', 'Leadership'],
      };

    case NotificationEvent.DeliverableDueApproaching:
      return {
        subject: `Deliverable Due Soon: ${ctx.deliverableName ?? 'Untitled'}`,
        body: `The deliverable "${ctx.deliverableName}" for project ${ctx.projectCode ?? ''} is due on ${ctx.dueDate ?? 'TBD'}.`,
        type: NotificationType.Email,
        recipientRoles: ['Estimator', 'Preconstruction Manager'],
      };

    case NotificationEvent.WinLossRecorded:
      return {
        subject: `${ctx.outcome ?? 'Win/Loss'} Recorded: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A "${ctx.outcome}" outcome has been recorded for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Marketing Manager'],
      };

    case NotificationEvent.AutopsyScheduled:
      return {
        subject: `Loss Autopsy Scheduled: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A loss autopsy meeting has been scheduled for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).${ctx.meetingDate ? ` Date: ${ctx.meetingDate}.` : ''}${ctx.scheduledBy ? ` Scheduled by: ${ctx.scheduledBy}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Estimator'],
      };

    case NotificationEvent.TurnoverCompleted:
      return {
        subject: `Turnover Completed: ${ctx.projectCode ?? ''}`,
        body: `Project turnover has been completed for ${ctx.projectCode ?? 'Unknown project'} ("${ctx.leadTitle ?? ''}").`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Commercial Operations Manager'],
      };

    case NotificationEvent.SafetyFolderChanged:
      return {
        subject: `Safety Folder Updated: ${ctx.projectCode ?? ''}`,
        body: `The safety folder for project ${ctx.projectCode ?? ''} has been updated.`,
        type: NotificationType.Email,
        recipientRoles: ['Safety Manager', 'Commercial Operations Manager'],
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
        recipientRoles: ['Estimator', 'Business Development Manager', 'Leadership'],
      };

    case NotificationEvent.EstimatingKickoffScheduled:
      return {
        subject: `Estimating Kick-Off Scheduled: ${ctx.projectCode ?? ''}`,
        body: `An estimating kick-off meeting has been scheduled for "${ctx.leadTitle ?? 'Untitled'}" (${ctx.projectCode ?? ''}).`,
        type: NotificationType.Both,
        recipientRoles: ['Estimator', 'Leadership'],
      };

    case NotificationEvent.AutopsyFinalized:
      return {
        subject: `Post-Bid Autopsy Finalized: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Post-Bid Autopsy for "${ctx.leadTitle ?? 'Untitled'}" (${ctx.clientName ?? ''}) has been finalized.${ctx.processScore !== undefined ? ` Process Score: ${ctx.processScore}%.` : ''}${ctx.overallRating !== undefined ? ` Overall Rating: ${ctx.overallRating}/10.` : ''} Lessons Learned have been updated. Archive is now unlocked.`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Estimator', 'Preconstruction Manager'],
      };

    case NotificationEvent.CommitmentSubmitted:
      return {
        subject: `Commitment Review Required: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `A commitment for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been submitted for review.${ctx.contractValue !== undefined ? ` Contract value: $${ctx.contractValue.toLocaleString()}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership'],
      };

    case NotificationEvent.CommitmentWaiverRequired:
      return {
        subject: `Compliance Waiver Required: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `A compliance waiver (${ctx.waiverType ?? 'Unknown'}) is required for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''}.${ctx.contractValue !== undefined ? ` Contract value: $${ctx.contractValue.toLocaleString()}.` : ''} Please review in the Buyout Log.`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership', 'Risk Manager'],
      };

    case NotificationEvent.CommitmentApproved:
      return {
        subject: `Commitment Approved: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `The commitment for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been fully approved and is now Committed.${ctx.approverName ? ` Approved by: ${ctx.approverName}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Commercial Operations Manager'],
      };

    case NotificationEvent.CommitmentEscalatedToCFO:
      return {
        subject: `CFO Review Required: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `A high-value compliance waiver for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been escalated to the CFO for final review.${ctx.contractValue !== undefined ? ` Contract value: $${ctx.contractValue.toLocaleString()}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership'],
      };

    case NotificationEvent.CommitmentRejected:
      return {
        subject: `Commitment Rejected: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `The commitment for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been rejected.${ctx.approverName ? ` Rejected by: ${ctx.approverName}.` : ''} Please review and resubmit if applicable.`,
        type: NotificationType.Both,
        recipientRoles: ['Commercial Operations Manager'],
      };

    case NotificationEvent.ScorecardSubmittedForReview:
      return {
        subject: `Go/No-Go Scorecard Ready for Review: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A Go/No-Go scorecard for "${ctx.leadTitle}" (${ctx.clientName ?? ''}) has been submitted for review by ${ctx.submittedBy ?? 'Unknown'}.`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership'],
      };

    case NotificationEvent.ScorecardReturnedForRevision:
      return {
        subject: `Go/No-Go Scorecard Returned: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go scorecard for "${ctx.leadTitle}" has been returned for revision.${ctx.returnComment ? ` Comments: "${ctx.returnComment}"` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager'],
      };

    case NotificationEvent.ScorecardCommitteeScoresFinalized:
      return {
        subject: `Committee Scores Finalized: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `Committee scoring for "${ctx.leadTitle}" (${ctx.clientName ?? ''}) has been finalized.${ctx.committeeTotal !== undefined ? ` Committee total: ${ctx.committeeTotal}/92.` : ''} The scorecard is now pending a final decision.`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership', 'Business Development Manager'],
      };

    case NotificationEvent.ScorecardDecisionRecorded:
      return {
        subject: `Go/No-Go Decision Recorded: ${ctx.decision ?? 'Pending'} — ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A final "${ctx.decision}" decision has been recorded for "${ctx.leadTitle}" (${ctx.clientName ?? ''}).${ctx.score !== undefined ? ` Committee score: ${ctx.score}/92.` : ''}${ctx.projectCode ? ` Project code: ${ctx.projectCode}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Estimator', 'Preconstruction Manager'],
      };

    case NotificationEvent.ScorecardUnlockedForEditing:
      return {
        subject: `Go/No-Go Scorecard Unlocked: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go scorecard for "${ctx.leadTitle}" has been unlocked for editing by ${ctx.unlockedBy ?? 'Unknown'}.${ctx.reason ? ` Reason: ${ctx.reason}` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership'],
      };

    case NotificationEvent.ScorecardSubmittedToDirector:
      return {
        subject: `Go/No-Go Scorecard Submitted for Review: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `A Go/No-Go scorecard for "${ctx.leadTitle}" has been submitted for Director review by ${ctx.submittedBy ?? 'Unknown'}. Please review and approve, return, or reject.`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership'],
      };

    case NotificationEvent.ScorecardReturnedByDirector:
      return {
        subject: `Go/No-Go Scorecard Returned for Revision: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go scorecard for "${ctx.leadTitle}" has been returned for revision by the Director.${ctx.comment ? ` Comment: ${ctx.comment}` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager'],
      };

    case NotificationEvent.ScorecardRejectedByDirector:
      return {
        subject: `Go/No-Go Scorecard Rejected: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go scorecard for "${ctx.leadTitle}" has been rejected by the Director.${ctx.reason ? ` Reason: ${ctx.reason}` : ''} The BD Rep may revise and resubmit or archive.`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership'],
      };

    case NotificationEvent.ScorecardAdvancedToCommittee:
      return {
        subject: `Go/No-Go Scorecard Advanced to Committee: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go scorecard for "${ctx.leadTitle}" has been approved by the Director and advanced to the Go/No-Go Committee for scoring and decision.`,
        type: NotificationType.Both,
        recipientRoles: ['Leadership', 'Estimator'],
      };

    case NotificationEvent.ScorecardApprovedGo:
      return {
        subject: `GO Decision: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go Committee has approved "${ctx.leadTitle}" as GO.${ctx.conditions ? ` Conditions: ${ctx.conditions}` : ''} The Estimating Coordinator has been notified to proceed.`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership', 'Estimator'],
      };

    case NotificationEvent.ScorecardDecidedNoGo:
      return {
        subject: `NO GO Decision: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `The Go/No-Go Committee has decided NO GO for "${ctx.leadTitle}". The scorecard has been archived.`,
        type: NotificationType.Both,
        recipientRoles: ['Business Development Manager', 'Leadership'],
      };

    case NotificationEvent.EstimatingCoordinatorNotifiedGo:
      return {
        subject: `New GO Project Ready for Estimating: ${ctx.leadTitle ?? 'Untitled'}`,
        body: `"${ctx.leadTitle}" has received a GO decision on ${ctx.decisionDate ?? 'today'}. Please begin the estimating kickoff process.`,
        type: NotificationType.Both,
        recipientRoles: ['Estimator'],
      };

    case NotificationEvent.ContractTrackingSubmitted:
      return {
        subject: `Contract Tracking Review Required: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `A subcontract for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been submitted for tracking review.${ctx.contractValue !== undefined ? ` Contract value: $${ctx.contractValue.toLocaleString()}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Commercial Operations Manager'],
      };

    case NotificationEvent.ContractTrackingStepAdvanced:
      return {
        subject: `Contract Tracking Advanced: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `The contract tracking for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been approved and advanced to the next step.${ctx.approverName ? ` Approved by: ${ctx.approverName}.` : ''}`,
        type: NotificationType.Both,
        recipientRoles: ['Commercial Operations Manager', 'Risk Manager', 'Leadership'],
      };

    case NotificationEvent.ContractTrackingCompleted:
      return {
        subject: `Contract Tracked: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `The subcontract for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has completed all approval steps and is now fully tracked.`,
        type: NotificationType.Both,
        recipientRoles: ['Commercial Operations Manager'],
      };

    case NotificationEvent.ContractTrackingRejected:
      return {
        subject: `Contract Tracking Rejected: ${ctx.divisionDescription ?? 'Unknown Division'} — ${ctx.projectCode ?? ''}`,
        body: `The contract tracking for "${ctx.divisionDescription ?? ''}" on project ${ctx.projectCode ?? ''} has been rejected.${ctx.approverName ? ` Rejected by: ${ctx.approverName}.` : ''} Please review and resubmit if applicable.`,
        type: NotificationType.Both,
        recipientRoles: ['Commercial Operations Manager'],
      };

    default:
      return {
        subject: `Notification: ${event}`,
        body: `A notification event (${event}) occurred for project ${ctx.projectCode ?? ''}.`,
        type: NotificationType.Email,
        recipientRoles: ['Commercial Operations Manager'],
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
