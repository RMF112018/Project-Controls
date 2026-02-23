import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { IProjectTeamAssignment } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export const AssignmentsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [assignments, setAssignments] = React.useState<IProjectTeamAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [removingId, setRemovingId] = React.useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<IProjectTeamAssignment | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = React.useState(false);

  const fetchAssignments = React.useCallback(() => {
    setLoading(true);
    dataService.getAllProjectTeamAssignments()
      .then(result => setAssignments(result))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleRemoveClick = React.useCallback((assignment: IProjectTeamAssignment) => {
    setRemoveTarget(assignment);
    setRemoveConfirmOpen(true);
  }, []);

  const confirmRemove = React.useCallback(async () => {
    if (!removeTarget) return;
    setRemoveConfirmOpen(false);
    setRemovingId(removeTarget.id);
    try {
      await dataService.removeProjectTeamAssignment(removeTarget.id);
      await dataService.logAudit({
        Action: AuditAction.ProjectTeamRemoved,
        EntityType: EntityType.ProjectTeamAssignment,
        EntityId: String(removeTarget.id),
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({
          projectCode: removeTarget.projectCode,
          user: removeTarget.userDisplayName,
          role: removeTarget.assignedRole,
        }),
      });
      addToast(`Assignment for "${removeTarget.userDisplayName}" removed.`, 'success');
      fetchAssignments();
    } catch {
      addToast('Failed to remove assignment.', 'error');
    } finally {
      setRemovingId(null);
      setRemoveTarget(null);
    }
  }, [removeTarget, dataService, currentUser, addToast, fetchAssignments]);

  const handleAddAssignment = React.useCallback(() => {
    addToast('Add Assignment form coming soon.', 'info');
  }, [addToast]);

  const columns = React.useMemo((): IHbcDataTableColumn<IProjectTeamAssignment>[] => [
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (row) => row.projectCode,
    },
    {
      key: 'userDisplayName',
      header: 'Name',
      render: (row) => row.userDisplayName,
    },
    {
      key: 'userEmail',
      header: 'Email',
      render: (row) => row.userEmail || '\u2014',
    },
    {
      key: 'assignedRole',
      header: 'Role',
      render: (row) => row.assignedRole,
    },
    {
      key: 'assignedBy',
      header: 'Assigned By',
      render: (row) => row.assignedBy || '\u2014',
    },
    {
      key: 'assignedDate',
      header: 'Assigned Date',
      render: (row) => formatDate(row.assignedDate),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? tokens.colorStatusSuccessForeground2 : tokens.colorStatusDangerForeground2}
          backgroundColor={row.isActive ? tokens.colorStatusSuccessBackground2 : tokens.colorStatusDangerBackground2}
        />
      ),
    },
  ], []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Project Team Assignments" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Project Team Assignments"
        subtitle="View and manage project team role assignments across all projects."
        actions={
          <HbcButton emphasis="strong" onClick={handleAddAssignment}>
            Add Assignment
          </HbcButton>
        }
      />
      <div className={styles.container}>
        <HbcDataTable
          tableId="admin-project-assignments"
          columns={columns}
          items={assignments}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
          rowActions={(row) => (
            <HbcButton
              isLoading={removingId === row.id}
              onClick={() => handleRemoveClick(row)}
            >
              Remove
            </HbcButton>
          )}
        />
      </div>

      <ConfirmDialog
        open={removeConfirmOpen}
        title="Remove Team Assignment"
        message={removeTarget
          ? `Remove "${removeTarget.userDisplayName}" (${removeTarget.assignedRole}) from project ${removeTarget.projectCode}?`
          : 'Remove this assignment?'
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => { setRemoveConfirmOpen(false); setRemoveTarget(null); }}
        danger
      />
    </div>
  );
};
