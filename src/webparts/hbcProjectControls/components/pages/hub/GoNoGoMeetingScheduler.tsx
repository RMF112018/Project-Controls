import * as React from 'react';
import { useParams, useNavigate, useLocation } from '@router';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';
import {
  MeetingType,
  RoleName,
  ILead,
  IMeeting,
  NotificationEvent,
  AuditAction,
  EntityType,
  buildBreadcrumbs
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useNotifications } from '../../hooks/useNotifications';
import { MeetingScheduler } from '../../shared/MeetingScheduler';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { RoleGate } from '../../guards/RoleGate';

export function GoNoGoMeetingScheduler(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { dataService, currentUser } = useAppContext();
  const { getLeadById } = useLeads();
  const { notify } = useNotifications();
  const [lead, setLead] = React.useState<ILead | null>(null);
  const [committeeEmails, setCommitteeEmails] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const leadId = parseInt(id ?? '0', 10);
        const [leadData, roles] = await Promise.all([
          getLeadById(leadId),
          dataService.getRoles(),
        ]);
        setLead(leadData);

        // Get Executive Leadership + Department Director emails for GNG committee
        const execRole = roles.find(r => r.Title === RoleName.ExecutiveLeadership);
        const directorRole = roles.find(r => r.Title === RoleName.DepartmentDirector);
        const emails = [...(execRole?.UserOrGroup ?? []), ...(directorRole?.UserOrGroup ?? [])];
        setCommitteeEmails([...new Set(emails)]);
      } catch {
        // Error handled via empty state
      } finally {
        setLoading(false);
      }
    };
    loadData().catch(console.error);
  }, [id, getLeadById, dataService]);

  const handleScheduled = React.useCallback((meeting: IMeeting) => {
    // Fire-and-forget notification
    if (lead) {
      notify(NotificationEvent.GoNoGoScoringRequested, {
        leadTitle: lead.Title,
        leadId: lead.id,
        clientName: lead.ClientName,
        meetingDate: new Date(meeting.startTime).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit',
        }),
      }).catch(console.error);

      // Fire-and-forget audit log for meeting scheduling
      dataService.logAudit({
        Action: AuditAction.MeetingScheduled,
        EntityType: EntityType.Lead,
        EntityId: String(lead.id),
        ProjectCode: lead.ProjectCode,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        Details: `Go/No-Go meeting scheduled for "${lead.Title}" on ${new Date(meeting.startTime).toLocaleDateString()}`,
      }).catch(console.error);
    }
    navigate(`/lead/${id}`);
  }, [lead, id, navigate, notify, dataService, currentUser]);

  const handleCancel = React.useCallback(() => {
    navigate(`/lead/${id}`);
  }, [id, navigate]);

  if (loading) {
    return <SkeletonLoader variant="form" rows={4} />;
  }

  if (!lead) {
    return (
      <div style={{ padding: SPACING.xl, color: HBC_COLORS.error }}>
        Lead not found.
      </div>
    );
  }

  // Date range: next business week (Mon-Fri)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const nextFriday = new Date(nextMonday);
  nextFriday.setDate(nextMonday.getDate() + 4);

  const startDate = nextMonday.toISOString().split('T')[0];
  const endDate = nextFriday.toISOString().split('T')[0];

  return (
    <RoleGate allowedRoles={[RoleName.BDRepresentative, RoleName.ExecutiveLeadership, RoleName.DepartmentDirector]}>
      <PageHeader
        title={`Schedule Go/No-Go Meeting`}
        subtitle={`${lead.Title} — ${lead.ClientName ?? ''}`}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
      />
      <div style={{ padding: SPACING.md }}>
        <MeetingScheduler
          meetingType={MeetingType.GoNoGo}
          subject={`Go/No-Go: ${lead.Title}`}
          attendeeEmails={committeeEmails}
          leadId={lead.id}
          projectCode={lead.ProjectCode}
          startDate={startDate}
          endDate={endDate}
          onScheduled={handleScheduled}
          onCancel={handleCancel}
        />
      </div>
    </RoleGate>
  );
}
