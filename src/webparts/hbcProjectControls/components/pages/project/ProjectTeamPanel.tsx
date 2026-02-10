import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '../../contexts/AppContext';
import { usePermissionEngine } from '../../hooks/usePermissionEngine';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { AzureADPeoplePicker } from '../../shared/AzureADPeoplePicker';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { StatusBadge } from '../../shared/StatusBadge';
import { IProjectTeamAssignment, IPermissionTemplate } from '../../../models/IPermissionTemplate';
import { IPersonAssignment } from '../../../models/IWorkflowDefinition';
import { AuditAction, EntityType } from '../../../models/enums';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

interface IProjectTeamPanelProps {
  projectCode: string;
}

export const ProjectTeamPanel: React.FC<IProjectTeamPanelProps> = ({ projectCode }) => {
  const { dataService, currentUser, hasPermission } = useAppContext();
  const {
    templates,
    loading,
    fetchTemplates,
    getProjectTeam,
    assignToProject,
    removeFromProject,
    updateAssignment,
  } = usePermissionEngine();

  const [assignments, setAssignments] = React.useState<IProjectTeamAssignment[]>([]);
  const [teamLoading, setTeamLoading] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [selectedPerson, setSelectedPerson] = React.useState<IPersonAssignment | null>(null);
  const [newRole, setNewRole] = React.useState('');
  const [newTemplateId, setNewTemplateId] = React.useState<number | undefined>(undefined);
  const [adding, setAdding] = React.useState(false);

  const canManage = hasPermission('permission:project_team:manage');

  const loadTeam = React.useCallback(async (): Promise<void> => {
    setTeamLoading(true);
    try {
      const team = await getProjectTeam(projectCode);
      setAssignments(team);
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setTeamLoading(false);
    }
  }, [projectCode, getProjectTeam]);

  React.useEffect(() => {
    loadTeam().catch(console.error);
    fetchTemplates().catch(console.error);
  }, [loadTeam, fetchTemplates]);

  const logAudit = (action: AuditAction, entityId: string, details: string): void => {
    dataService.logAudit({
      Action: action,
      EntityType: EntityType.ProjectTeamAssignment,
      EntityId: entityId,
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: details,
    }).catch(console.error);
  };

  const handleAdd = async (): Promise<void> => {
    if (!selectedPerson || !newRole.trim()) return;
    setAdding(true);
    try {
      await assignToProject({
        projectCode,
        userId: selectedPerson.userId,
        userDisplayName: selectedPerson.displayName,
        userEmail: selectedPerson.email,
        assignedRole: newRole.trim(),
        templateOverrideId: newTemplateId,
        assignedBy: currentUser?.displayName || 'Unknown',
        assignedDate: new Date().toISOString(),
        isActive: true,
      });
      logAudit(AuditAction.ProjectTeamAssigned, selectedPerson.email, `Assigned ${selectedPerson.displayName} as "${newRole}" to ${projectCode}`);
      setShowAddForm(false);
      setSelectedPerson(null);
      setNewRole('');
      setNewTemplateId(undefined);
      await loadTeam();
    } catch (err) {
      console.error('Failed to add team member:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (assignment: IProjectTeamAssignment): Promise<void> => {
    const confirmed = window.confirm(`Remove ${assignment.userDisplayName} from this project?`);
    if (!confirmed) return;
    try {
      await removeFromProject(assignment.id);
      logAudit(AuditAction.ProjectTeamRemoved, String(assignment.id), `Removed ${assignment.userDisplayName} from ${projectCode}`);
      await loadTeam();
    } catch (err) {
      console.error('Failed to remove team member:', err);
    }
  };

  const handleOverrideTemplate = async (assignment: IProjectTeamAssignment, templateId: number | undefined): Promise<void> => {
    try {
      await updateAssignment(assignment.id, { templateOverrideId: templateId });
      logAudit(AuditAction.ProjectTeamOverridden, String(assignment.id),
        `Template override ${templateId ? `set to ${templateId}` : 'cleared'} for ${assignment.userDisplayName}`);
      await loadTeam();
    } catch (err) {
      console.error('Failed to update override:', err);
    }
  };

  const getTemplateName = (id: number | undefined): string => {
    if (!id) return '-';
    const tpl = templates.find(t => t.id === id);
    return tpl?.name || `Template #${id}`;
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px',
    color: HBC_COLORS.gray800, boxSizing: 'border-box' as const,
  };

  const columns: IDataTableColumn<IProjectTeamAssignment>[] = [
    { key: 'name', header: 'Name', render: (a) => (
      <div>
        <div style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{a.userDisplayName}</div>
        <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>{a.userEmail}</div>
      </div>
    )},
    { key: 'role', header: 'Role', width: '140px', render: (a) => (
      <span style={{ fontSize: '13px' }}>{a.assignedRole}</span>
    )},
    { key: 'template', header: 'Template Override', width: '200px', render: (a) => (
      canManage ? (
        <select
          value={a.templateOverrideId || ''}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            handleOverrideTemplate(a, val).catch(console.error);
          }}
          style={{ ...inputStyle, width: '100%', minWidth: '160px' }}
        >
          <option value="">No override</option>
          {templates.filter(t => t.isActive).map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      ) : (
        <span style={{ fontSize: '13px' }}>{getTemplateName(a.templateOverrideId)}</span>
      )
    )},
    { key: 'flags', header: 'Flags', width: '100px', render: (a) => {
      const count = a.granularFlagOverrides?.reduce((sum, o) => sum + o.flags.length, 0) || 0;
      if (count === 0) return <span style={{ color: HBC_COLORS.gray400 }}>-</span>;
      return (
        <StatusBadge
          label={`${count} flag${count !== 1 ? 's' : ''}`}
          color={HBC_COLORS.info}
          backgroundColor={HBC_COLORS.infoLight}
          size="small"
        />
      );
    }},
    { key: 'status', header: 'Status', width: '80px', render: (a) => (
      <span style={{
        display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
        backgroundColor: a.isActive ? HBC_COLORS.success : HBC_COLORS.gray300,
      }} />
    )},
  ];

  if (canManage) {
    columns.push({
      key: 'actions', header: '', width: '80px', render: (a) => (
        <Button size="small" appearance="subtle" style={{ color: HBC_COLORS.error, fontSize: '12px' }}
          onClick={(e) => { e.stopPropagation(); handleRemove(a).catch(console.error); }}>
          Remove
        </Button>
      ),
    });
  }

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '8px', padding: '20px',
      boxShadow: ELEVATION.level1, border: `1px solid ${HBC_COLORS.gray200}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>
            Project Team
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: HBC_COLORS.gray400 }}>
            Manage team assignments and permission overrides for this project
          </p>
        </div>
        {canManage && (
          <Button size="small" appearance="primary" style={{ backgroundColor: HBC_COLORS.navy }}
            onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Member'}
          </Button>
        )}
      </div>

      {/* Add member form */}
      {showAddForm && canManage && (
        <div style={{
          padding: '16px', marginBottom: '16px', borderRadius: '8px',
          backgroundColor: HBC_COLORS.gray50, border: `1px solid ${HBC_COLORS.gray200}`,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px' }}>
                Person
              </label>
              <AzureADPeoplePicker
                selectedUser={selectedPerson}
                onSelect={(person) => setSelectedPerson(person)}
                placeholder="Search for a person..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px' }}>
                Role
              </label>
              <input
                type="text"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="e.g., Lead PM, PX, Safety Officer"
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, marginBottom: '4px' }}>
                Template Override (Optional)
              </label>
              <select
                value={newTemplateId || ''}
                onChange={e => setNewTemplateId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ ...inputStyle, width: '100%' }}
              >
                <option value="">Use group default</option>
                {templates.filter(t => t.isActive).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" appearance="primary" style={{ backgroundColor: HBC_COLORS.navy }}
              disabled={adding || !selectedPerson || !newRole.trim()}
              onClick={() => { handleAdd().catch(console.error); }}>
              {adding ? 'Adding...' : 'Add to Project'}
            </Button>
          </div>
        </div>
      )}

      {/* Team table */}
      {teamLoading ? (
        <SkeletonLoader variant="table" rows={4} columns={5} />
      ) : (
        <DataTable<IProjectTeamAssignment>
          columns={columns}
          items={assignments}
          keyExtractor={a => a.id}
          emptyTitle="No team members assigned"
          emptyDescription={canManage ? 'Add team members to control project-level permissions.' : 'No team assignments for this project yet.'}
        />
      )}
    </div>
  );
};
