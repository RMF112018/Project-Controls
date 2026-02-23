import * as React from 'react';
import { Input, Select, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { StatusBadge } from '../../shared/StatusBadge';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { IWorkflowDefinition, IAssignmentMapping, AssignmentType } from '@hbc/sp-services';

const ASSIGNMENT_TYPE_OPTIONS: AssignmentType[] = ['Estimator', 'Director'];

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  addForm: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '0', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: '12px',
  },
  formField: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: 500 as const,
    color: tokens.colorNeutralForeground3,
  },
  truncated: {
    display: 'inline-block',
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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

export const WorkflowsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  // Workflow definitions state
  const [workflows, setWorkflows] = React.useState<IWorkflowDefinition[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = React.useState(true);

  // Assignment mappings state
  const [mappings, setMappings] = React.useState<IAssignmentMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = React.useState(true);

  // Delete confirmation state
  const [deletingMapping, setDeletingMapping] = React.useState<IAssignmentMapping | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // Add mapping form state
  const [newRegion, setNewRegion] = React.useState('');
  const [newSector, setNewSector] = React.useState('');
  const [newAssignmentType, setNewAssignmentType] = React.useState<AssignmentType>('Estimator');
  const [newAssigneeName, setNewAssigneeName] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const fetchWorkflows = React.useCallback(() => {
    setWorkflowsLoading(true);
    dataService.getWorkflowDefinitions()
      .then(result => setWorkflows(result))
      .catch(() => setWorkflows([]))
      .finally(() => setWorkflowsLoading(false));
  }, [dataService]);

  const fetchMappings = React.useCallback(() => {
    setMappingsLoading(true);
    dataService.getAssignmentMappings()
      .then(result => setMappings(result))
      .catch(() => setMappings([]))
      .finally(() => setMappingsLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  React.useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleDeleteMapping = React.useCallback((mapping: IAssignmentMapping) => {
    setDeletingMapping(mapping);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteMapping = React.useCallback(async () => {
    if (!deletingMapping) return;
    setDeleteConfirmOpen(false);
    try {
      await dataService.deleteAssignmentMapping(deletingMapping.id);
      await dataService.logAudit({
        Action: AuditAction.AssignmentMappingUpdated,
        EntityType: EntityType.AssignmentMapping,
        EntityId: String(deletingMapping.id),
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ action: 'deleted', region: deletingMapping.region, sector: deletingMapping.sector }),
      });
      addToast('Assignment mapping removed.', 'success');
      fetchMappings();
    } catch {
      addToast('Failed to remove assignment mapping.', 'error');
    } finally {
      setDeletingMapping(null);
    }
  }, [deletingMapping, dataService, currentUser, addToast, fetchMappings]);

  const handleAddMapping = React.useCallback(async () => {
    if (!newRegion.trim() || !newAssigneeName.trim()) {
      addToast('Region and Assignee Name are required.', 'warning');
      return;
    }
    setAdding(true);
    try {
      await dataService.createAssignmentMapping({
        region: newRegion.trim(),
        sector: newSector.trim() || 'All Sectors',
        assignmentType: newAssignmentType,
        assignee: {
          userId: '',
          displayName: newAssigneeName.trim(),
          email: '',
        },
      });
      await dataService.logAudit({
        Action: AuditAction.AssignmentMappingUpdated,
        EntityType: EntityType.AssignmentMapping,
        EntityId: 'new',
        User: currentUser?.email || 'unknown',
        Details: JSON.stringify({ action: 'created', region: newRegion, assignee: newAssigneeName }),
      });
      addToast('Assignment mapping created.', 'success');
      setNewRegion('');
      setNewSector('');
      setNewAssignmentType('Estimator');
      setNewAssigneeName('');
      fetchMappings();
    } catch {
      addToast('Failed to create assignment mapping.', 'error');
    } finally {
      setAdding(false);
    }
  }, [newRegion, newSector, newAssignmentType, newAssigneeName, dataService, currentUser, addToast, fetchMappings]);

  const workflowColumns = React.useMemo((): IHbcDataTableColumn<IWorkflowDefinition>[] => [
    {
      key: 'name',
      header: 'Name',
      render: (row) => row.name,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className={styles.truncated} title={row.description}>
          {row.description && row.description.length > 60
            ? `${row.description.slice(0, 60)}...`
            : row.description || '\u2014'}
        </span>
      ),
    },
    {
      key: 'steps',
      header: 'Steps',
      render: (row) => String(row.steps.length),
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
    {
      key: 'lastModifiedDate',
      header: 'Last Modified',
      render: (row) => formatDate(row.lastModifiedDate),
    },
  ], [styles]);

  const mappingColumns = React.useMemo((): IHbcDataTableColumn<IAssignmentMapping>[] => [
    {
      key: 'region',
      header: 'Region',
      render: (row) => row.region,
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (row) => row.sector,
    },
    {
      key: 'assignmentType',
      header: 'Type',
      render: (row) => row.assignmentType,
    },
    {
      key: 'assigneeDisplayName',
      header: 'Assignee',
      render: (row) => row.assignee.displayName,
    },
    {
      key: 'assigneeEmail',
      header: 'Email',
      render: (row) => row.assignee.email || '\u2014',
    },
  ], []);

  if (workflowsLoading && mappingsLoading) {
    return (
      <div>
        <PageHeader title="Workflows & Assignments" />
        <div className={styles.container}>
          <HbcSkeleton variant="table" rows={5} />
          <HbcSkeleton variant="table" rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Workflows & Assignments"
        subtitle="Manage workflow definitions and region-based assignment mappings."
      />
      <div className={styles.container}>
        {/* Workflow Definitions Section */}
        <div>
          <HbcDataTable
            tableId="admin-workflow-definitions"
            columns={workflowColumns}
            items={workflows}
            isLoading={workflowsLoading}
            keyExtractor={(row) => String(row.id)}
          />
        </div>

        {/* Assignment Mappings Section */}
        <CollapsibleSection title="Assignment Mappings" subtitle={`${mappings.length} mapping(s)`}>
          <div className={styles.addForm}>
            <div className={styles.formField}>
              <span className={styles.formLabel}>Region</span>
              <Input
                value={newRegion}
                onChange={(_, data) => setNewRegion(data.value)}
                placeholder="e.g. Southeast"
                aria-label="Region"
              />
            </div>
            <div className={styles.formField}>
              <span className={styles.formLabel}>Sector</span>
              <Input
                value={newSector}
                onChange={(_, data) => setNewSector(data.value)}
                placeholder="All Sectors"
                aria-label="Sector"
              />
            </div>
            <div className={styles.formField}>
              <span className={styles.formLabel}>Assignment Type</span>
              <Select
                value={newAssignmentType}
                onChange={(_, data) => setNewAssignmentType(data.value as AssignmentType)}
                aria-label="Assignment type"
              >
                {ASSIGNMENT_TYPE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
            </div>
            <div className={styles.formField}>
              <span className={styles.formLabel}>Assignee Name</span>
              <Input
                value={newAssigneeName}
                onChange={(_, data) => setNewAssigneeName(data.value)}
                placeholder="John Smith"
                aria-label="Assignee name"
              />
            </div>
            <HbcButton emphasis="strong" isLoading={adding} onClick={handleAddMapping}>
              Add
            </HbcButton>
          </div>

          <HbcDataTable
            tableId="admin-assignment-mappings"
            columns={mappingColumns}
            items={mappings}
            isLoading={mappingsLoading}
            keyExtractor={(row) => String(row.id)}
            rowActions={(row) => (
              <HbcButton onClick={() => handleDeleteMapping(row)}>
                Remove
              </HbcButton>
            )}
          />
        </CollapsibleSection>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Remove Assignment Mapping"
        message={deletingMapping
          ? `Remove the "${deletingMapping.assignee.displayName}" mapping for ${deletingMapping.region} / ${deletingMapping.sector}?`
          : 'Remove this assignment mapping?'
        }
        confirmLabel="Remove"
        onConfirm={confirmDeleteMapping}
        onCancel={() => { setDeleteConfirmOpen(false); setDeletingMapping(null); }}
        danger
      />
    </div>
  );
};
