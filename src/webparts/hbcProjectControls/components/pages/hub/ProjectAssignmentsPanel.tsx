import * as React from 'react';
import { Button } from '@fluentui/react-components';
import {
  ChevronDown24Regular,
  ChevronRight24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import { useAppContext } from '../../contexts/AppContext';
import { usePermissionEngine } from '../../hooks/usePermissionEngine';
import { AzureADPeoplePicker } from '../../shared/AzureADPeoplePicker';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';
import {
  IProjectTeamAssignment,
  IPersonAssignment,
  ILead,
  RoleName,
  AuditAction,
  EntityType
} from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

const ROLE_OPTIONS = Object.values(RoleName);

interface IProjectRow {
  projectCode: string;
  projectName: string;
  teamCount: number;
}

export const ProjectAssignmentsPanel: React.FC = () => {
  const { dataService, currentUser } = useAppContext();
  const {
    templates,
    fetchTemplates,
    getAllAssignments,
    assignToProject,
    removeFromProject,
    inviteToSiteGroup,
  } = usePermissionEngine();

  const [leads, setLeads] = React.useState<ILead[]>([]);

  const [assignments, setAssignments] = React.useState<IProjectTeamAssignment[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [expandedProject, setExpandedProject] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [adding, setAdding] = React.useState<Record<string, boolean>>({});

  // Per-project inline form state
  const [selectedUsers, setSelectedUsers] = React.useState<IPersonAssignment[]>([]);
  const [formRole, setFormRole] = React.useState('');
  const [formTemplateOverrideId, setFormTemplateOverrideId] = React.useState<number | undefined>(undefined);

  const loadAssignments = React.useCallback(async (): Promise<void> => {
    setDataLoading(true);
    try {
      const data = await getAllAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setDataLoading(false);
    }
  }, [getAllAssignments]);

  const fetchLeads = React.useCallback(async (): Promise<void> => {
    try {
      const result = await dataService.getLeads();
      setLeads(result.items);
    } catch (err) {
      console.error('Failed to load leads:', err);
    }
  }, [dataService]);

  React.useEffect(() => {
    loadAssignments().catch(console.error);
    fetchTemplates().catch(console.error);
    fetchLeads().catch(console.error);
  }, [loadAssignments, fetchTemplates, fetchLeads]);

  const logAudit = (action: AuditAction, entityId: string, details: string, pCode?: string): void => {
    dataService.logAudit({
      Action: action,
      EntityType: EntityType.ProjectTeamAssignment,
      EntityId: entityId,
      ProjectCode: pCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: details,
    }).catch(console.error);
  };

  // Group assignments by projectCode
  const projectGroups = React.useMemo(() => {
    const groups: Record<string, IProjectTeamAssignment[]> = {};
    for (const a of assignments) {
      (groups[a.projectCode] ??= []).push(a);
    }
    return groups;
  }, [assignments]);

  // Build project rows
  const projectRows = React.useMemo((): IProjectRow[] => {
    return Object.entries(projectGroups)
      .map(([code, members]) => ({
        projectCode: code,
        projectName: leads.find(l => l.ProjectCode === code)?.Title || code,
        teamCount: members.length,
      }))
      .filter(row =>
        !searchQuery.trim() ||
        row.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.projectName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.projectCode.localeCompare(b.projectCode));
  }, [projectGroups, leads, searchQuery]);

  const getTemplateName = (id: number | undefined): string => {
    if (!id) return '-';
    const tpl = templates.find(t => t.id === id);
    return tpl?.name || `Template #${id}`;
  };

  const handleExpandToggle = (projectCode: string): void => {
    if (expandedProject === projectCode) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectCode);
      // Reset inline form state when expanding a new project
      setSelectedUsers([]);
      setFormRole('');
      setFormTemplateOverrideId(undefined);
    }
  };

  const handleBatchAdd = async (projectCode: string, _projectName: string): Promise<void> => {
    if (selectedUsers.length === 0 || !formRole.trim()) return;
    setAdding(prev => ({ ...prev, [projectCode]: true }));
    try {
      for (const user of selectedUsers) {
        const result = await assignToProject({
          projectCode,
          userId: user.userId,
          userDisplayName: user.displayName,
          userEmail: user.email,
          assignedRole: formRole.trim(),
          templateOverrideId: formTemplateOverrideId,
          assignedBy: currentUser?.displayName || 'Unknown',
          assignedDate: new Date().toISOString(),
          isActive: true,
        });
        inviteToSiteGroup(projectCode, user.email, formRole.trim()).catch(console.error);
        logAudit(
          AuditAction.ProjectTeamAssigned,
          String(result.id),
          `Assigned ${user.displayName} as "${formRole.trim()}" to ${projectCode}`,
          projectCode
        );
      }
      // Reset form and refresh
      setSelectedUsers([]);
      setFormRole('');
      setFormTemplateOverrideId(undefined);
      await loadAssignments();
    } catch (err) {
      console.error('Failed to add assignments:', err);
    } finally {
      setAdding(prev => ({ ...prev, [projectCode]: false }));
    }
  };

  const handleRemove = async (assignment: IProjectTeamAssignment): Promise<void> => {
    const confirmed = window.confirm(
      `Remove ${assignment.userDisplayName} from project ${assignment.projectCode}?`
    );
    if (!confirmed) return;
    try {
      await removeFromProject(assignment.id);
      logAudit(
        AuditAction.ProjectTeamRemoved,
        String(assignment.id),
        `Removed ${assignment.userDisplayName} from ${assignment.projectCode}`,
        assignment.projectCode
      );
      await loadAssignments();
    } catch (err) {
      console.error('Failed to remove assignment:', err);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray200}`,
    fontSize: '13px',
    color: HBC_COLORS.gray800,
    boxSizing: 'border-box' as const,
  };

  const projectColumns: IHbcTanStackTableColumn<IProjectRow>[] = [
    {
      key: 'projectCode', header: 'Project Code', width: '130px', sortable: true, render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: HBC_COLORS.navy }}>{row.projectCode}</span>
      ),
    },
    {
      key: 'projectName', header: 'Project Name', render: (row) => (
        <span style={{ fontSize: '13px', color: HBC_COLORS.gray800 }}>{row.projectName}</span>
      ),
    },
    {
      key: 'team', header: 'Team', width: '80px', render: (row) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          borderRadius: '12px',
          backgroundColor: HBC_COLORS.infoLight,
          color: HBC_COLORS.info,
          fontSize: '12px',
          fontWeight: 600,
        }}>
          <People24Regular style={{ fontSize: '14px' }} />
          {row.teamCount}
        </span>
      ),
    },
    {
      key: 'actions', header: '', width: '80px', render: (row) => (
        <Button
          size="small"
          appearance="subtle"
          icon={expandedProject === row.projectCode ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
          onClick={(e) => { e.stopPropagation(); handleExpandToggle(row.projectCode); }}
          style={{ color: HBC_COLORS.navy }}
        />
      ),
    },
  ];

  const assignmentColumns: IHbcTanStackTableColumn<IProjectTeamAssignment>[] = [
    {
      key: 'name', header: 'Name', render: (a) => (
        <div>
          <div style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{a.userDisplayName}</div>
          <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{a.userEmail}</div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role', width: '160px', render: (a) => (
        <span style={{ fontSize: '13px' }}>{a.assignedRole}</span>
      ),
    },
    {
      key: 'template', header: 'Template Override', width: '180px', render: (a) => (
        <span style={{ fontSize: '13px', color: a.templateOverrideId ? HBC_COLORS.gray800 : HBC_COLORS.gray400 }}>
          {getTemplateName(a.templateOverrideId)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', width: '90px', render: (a) => (
        <StatusBadge
          label={a.isActive ? 'Active' : 'Inactive'}
          color={a.isActive ? HBC_COLORS.success : HBC_COLORS.gray400}
          backgroundColor={a.isActive ? HBC_COLORS.successLight : HBC_COLORS.gray100}
          size="small"
        />
      ),
    },
    {
      key: 'actions', header: '', width: '80px', render: (a) => (
        <Button
          size="small"
          appearance="subtle"
          style={{ color: HBC_COLORS.error, fontSize: '12px' }}
          onClick={(e) => { e.stopPropagation(); handleRemove(a).catch(console.error); }}
        >
          Remove
        </Button>
      ),
    },
  ];

  const renderExpandedSection = (projectCode: string): React.ReactNode => {
    const members = projectGroups[projectCode] || [];
    const projectName = leads.find(l => l.ProjectCode === projectCode)?.Title || projectCode;
    const isAdding = adding[projectCode] || false;

    return (
      <div style={{
        margin: '0 0 16px',
        padding: '16px',
        borderRadius: '0 0 8px 8px',
        backgroundColor: HBC_COLORS.white,
        border: `1px solid ${HBC_COLORS.gray200}`,
        borderTop: `2px solid ${HBC_COLORS.navy}`,
        boxShadow: ELEVATION.level2,
      }}>
        {/* Sub-table of assignments */}
        <div style={{ marginBottom: '16px' }}>
          <HbcTanStackTable<IProjectTeamAssignment>
            columns={assignmentColumns}
            items={members}
            keyExtractor={a => a.id}
            emptyTitle="No team members assigned"
            emptyDescription="Use the form below to assign team members."
            ariaLabel="Project team assignments table"
          />
        </div>

        {/* Inline add form */}
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: HBC_COLORS.gray50,
          border: `1px solid ${HBC_COLORS.gray200}`,
        }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy }}>
            Add Team Members
          </h4>
          {/* Row 1: Multi-select people picker */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px' }}>
              People
            </label>
            <AzureADPeoplePicker
              multiSelect={true}
              selectedUsers={selectedUsers}
              onSelectMulti={(users) => setSelectedUsers(users)}
              placeholder="Search and select people to assign..."
            />
          </div>
          {/* Row 2: Role + Template + Submit */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px' }}>
                Role
              </label>
              <select
                aria-label="Select project role"
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="">Select role...</option>
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px' }}>
                Template Override (Optional)
              </label>
              <select
                aria-label="Select template override"
                value={formTemplateOverrideId || ''}
                onChange={e => setFormTemplateOverrideId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="">Use group default</option>
                {templates.filter(t => t.isActive).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <Button
              size="small"
              appearance="primary"
              style={{ backgroundColor: HBC_COLORS.navy, whiteSpace: 'nowrap' }}
              disabled={isAdding || selectedUsers.length === 0 || !formRole.trim()}
              onClick={() => { handleBatchAdd(projectCode, projectName).catch(console.error); }}
            >
              {isAdding ? 'Assigning...' : `Assign to ${projectName.length > 25 ? projectName.slice(0, 25) + '...' : projectName}`}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (dataLoading) {
    return <SkeletonLoader variant="table" rows={6} columns={4} />;
  }

  return (
    <div>
      {/* Search bar + total count */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by project name or code..."
          style={{ ...inputStyle, flex: '1 1 300px' }}
        />
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: HBC_COLORS.gray100,
          color: HBC_COLORS.gray600,
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {assignments.length} total assignment{assignments.length !== 1 ? 's' : ''} across {Object.keys(projectGroups).length} project{Object.keys(projectGroups).length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Project table */}
      <HbcTanStackTable<IProjectRow>
        columns={projectColumns}
        items={projectRows}
        keyExtractor={row => row.projectCode}
        onRowClick={(row) => handleExpandToggle(row.projectCode)}
        emptyTitle="No project assignments"
        emptyDescription="Assign users to projects using the admin interface."
        ariaLabel="Projects with team assignment counts table"
      />

      {/* Expanded section renders below the project table */}
      {expandedProject && projectGroups[expandedProject] && renderExpandedSection(expandedProject)}
    </div>
  );
};
