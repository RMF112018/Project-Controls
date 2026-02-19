import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { RoleGate } from '../../guards/RoleGate';
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';
import {
  ILead,
  ITeamMember,
  RoleName,
  buildBreadcrumbs,
  formatCurrency,
  formatDate,
  formatSquareFeet
} from '@hbc/sp-services';
import { HBC_COLORS, SPACING, ELEVATION } from '../../../theme/tokens';

const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  padding: SPACING.lg,
  boxShadow: ELEVATION.level1,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: `0 0 ${SPACING.md}`,
  fontSize: '16px',
  fontWeight: 700,
  color: HBC_COLORS.navy,
};

const fieldStyle: React.CSSProperties = { marginBottom: '12px' };
const labelStyle: React.CSSProperties = { fontSize: '12px', color: HBC_COLORS.gray500, display: 'block', marginBottom: '2px' };
const valueStyle: React.CSSProperties = { fontSize: '14px', color: HBC_COLORS.gray800 };

const teamColumns: IHbcTanStackTableColumn<ITeamMember>[] = [
  { key: 'name', header: 'Name', render: (m) => m.name },
  { key: 'role', header: 'Role', render: (m) => m.role },
  { key: 'department', header: 'Department', render: (m) => m.department },
  { key: 'email', header: 'Email', render: (m) => m.email },
  { key: 'phone', header: 'Phone', render: (m) => m.phone || '-' },
];

export const PreconKickoff: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject } = useAppContext();
  const { leads, isLoading: leadsLoading, fetchLeads } = useLeads();
  const {
    teamMembers,
    isLoading: workflowLoading,
    error: workflowError,
    fetchTeamMembers,
    scheduleKickoffMeeting,
  } = useWorkflow();

  const [project, setProject] = React.useState<ILead | null>(null);
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);

  const projectCode = selectedProject?.projectCode || '';

  // Load leads to find the project
  React.useEffect(() => {
    fetchLeads().catch(console.error);
  }, [fetchLeads]);

  // Find the project lead by projectCode
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) {
      const found = leads.find((l) => l.ProjectCode === projectCode);
      setProject(found || null);
    }
  }, [leads, projectCode]);

  // Load team members once projectCode is available
  React.useEffect(() => {
    if (projectCode) {
      fetchTeamMembers(projectCode).catch(console.error);
    }
  }, [projectCode, fetchTeamMembers]);

  // Auto-dismiss toast after 4 seconds
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toastMessage]);

  const handleScheduleKickoff = React.useCallback(async (): Promise<void> => {
    if (!project || teamMembers.length === 0) return;

    try {
      setIsScheduling(true);
      setScheduleError(null);
      const attendeeEmails = teamMembers.map((m) => m.email);
      await scheduleKickoffMeeting(projectCode, project.id, attendeeEmails);
      setToastMessage('Kickoff meeting scheduled successfully.');
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Failed to schedule kickoff meeting');
    } finally {
      setIsScheduling(false);
    }
  }, [project, teamMembers, projectCode, scheduleKickoffMeeting]);

  const isLoading = leadsLoading || workflowLoading;

  if (isLoading && !project) {
    return <SkeletonLoader variant="table" rows={8} columns={5} />;
  }

  if (!project) {
    return (
      <div style={{ padding: SPACING.xxl, textAlign: 'center' }}>
        <h2 style={{ color: HBC_COLORS.gray500 }}>Project not found</h2>
        <p style={{ color: HBC_COLORS.gray400 }}>
          No project matches code: {projectCode || 'unknown'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Preconstruction Kickoff"
        subtitle={`${project.Title} — ${project.ClientName}`}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
      />

      {/* Toast message */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: HBC_COLORS.success,
            color: HBC_COLORS.white,
            padding: '12px 20px',
            borderRadius: '6px',
            marginBottom: SPACING.md,
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: HBC_COLORS.white,
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 0 0 12px',
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Error display */}
      {(workflowError || scheduleError) && (
        <div
          style={{
            backgroundColor: HBC_COLORS.errorLight,
            color: HBC_COLORS.error,
            padding: '12px 20px',
            borderRadius: '6px',
            marginBottom: SPACING.md,
            fontSize: '14px',
          }}
        >
          {scheduleError || workflowError}
        </div>
      )}

      {/* Project Summary Card */}
      <div style={{ ...cardStyle, marginBottom: SPACING.lg }}>
        <h3 style={sectionTitleStyle}>Project Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: SPACING.md }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Project</span>
            <span style={valueStyle}>{project.Title}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Client</span>
            <span style={valueStyle}>{project.ClientName}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Project Value</span>
            <span style={valueStyle}>{formatCurrency(project.ProjectValue)}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Square Feet</span>
            <span style={valueStyle}>{formatSquareFeet(project.SquareFeet)}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Delivery Method</span>
            <span style={valueStyle}>{project.DeliveryMethod || '-'}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Region</span>
            <span style={valueStyle}>{project.Region}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Sector</span>
            <span style={valueStyle}>{project.Sector}{project.SubSector ? ` / ${project.SubSector}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Key Dates and Schedule Action - side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.lg, marginBottom: SPACING.lg }}>
        {/* Key Dates Card */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Key Dates</h3>
          <div style={fieldStyle}>
            <span style={labelStyle}>Date of Evaluation</span>
            <span style={valueStyle}>{formatDate(project.DateOfEvaluation)}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Project Start Date</span>
            <span style={valueStyle}>{formatDate(project.ProjectStartDate)}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Proposal / Bid Due</span>
            <span style={valueStyle}>{formatDate(project.ProposalBidDue)}</span>
          </div>
          {project.AwardDate && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Award Date</span>
              <span style={valueStyle}>{formatDate(project.AwardDate)}</span>
            </div>
          )}
        </div>

        {/* Schedule Kickoff Card */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Kickoff Meeting</h3>
          <p style={{ fontSize: '14px', color: HBC_COLORS.gray600, margin: `0 0 ${SPACING.md}`, lineHeight: '1.5' }}>
            Schedule the preconstruction kickoff meeting with all assigned team members.
            {teamMembers.length > 0
              ? ` ${teamMembers.length} team member${teamMembers.length === 1 ? '' : 's'} will be invited.`
              : ' No team members have been assigned yet.'}
          </p>
          <RoleGate
            allowedRoles={[RoleName.PreconstructionTeam, RoleName.BDRepresentative]}
          >
            <button
              onClick={handleScheduleKickoff}
              disabled={isScheduling || teamMembers.length === 0}
              style={{
                backgroundColor: isScheduling || teamMembers.length === 0
                  ? HBC_COLORS.gray300
                  : HBC_COLORS.orange,
                color: HBC_COLORS.white,
                border: 'none',
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isScheduling || teamMembers.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Kickoff Meeting'}
            </button>
          </RoleGate>
        </div>
      </div>

      {/* Team Members Table */}
      <div style={{ marginBottom: SPACING.lg }}>
        <h3 style={{ ...sectionTitleStyle, marginBottom: SPACING.md }}>Team Members</h3>
        <HbcTanStackTable<ITeamMember>
          columns={teamColumns}
          items={teamMembers}
          keyExtractor={(m) => m.id}
          isLoading={workflowLoading}
          emptyTitle="No team members"
          emptyDescription="No team members have been assigned to this project yet."
          ariaLabel="Preconstruction kickoff team members table"
        />
      </div>
    </div>
  );
};
