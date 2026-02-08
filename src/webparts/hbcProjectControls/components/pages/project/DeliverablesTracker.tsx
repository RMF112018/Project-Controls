import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { DataTable } from '../../shared/DataTable';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { RoleGate } from '../../guards/RoleGate';
import { IDeliverable, RoleName, DeliverableStatus } from '../../../models';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';
import { formatDate, getDaysUntil, getUrgencyColor } from '../../../utils/formatters';
import type { IDataTableColumn } from '../../shared/DataTable';

type DeliverableDepartment = IDeliverable['department'];

const DEPARTMENT_OPTIONS: DeliverableDepartment[] = ['Estimating', 'Marketing', 'IDS', 'BD'];

const STATUS_OPTIONS: DeliverableStatus[] = [
  DeliverableStatus.NotStarted,
  DeliverableStatus.InProgress,
  DeliverableStatus.InReview,
  DeliverableStatus.Complete,
];

const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  padding: SPACING.lg,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

interface INewDeliverableForm {
  name: string;
  department: DeliverableDepartment;
  assignedTo: string;
  dueDate: string;
}

const emptyForm: INewDeliverableForm = {
  name: '',
  department: 'Estimating',
  assignedTo: '',
  dueDate: '',
};

export const DeliverablesTracker: React.FC = () => {
  const { selectedProject } = useAppContext();
  const {
    deliverables,
    isLoading,
    error,
    fetchDeliverables,
    createDeliverable,
    updateDeliverable,
  } = useWorkflow();

  const [editingStatusId, setEditingStatusId] = React.useState<number | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formData, setFormData] = React.useState<INewDeliverableForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const projectCode = selectedProject?.projectCode || '';

  // Load deliverables
  React.useEffect(() => {
    if (projectCode) {
      fetchDeliverables(projectCode).catch(console.error);
    }
  }, [projectCode, fetchDeliverables]);

  // KPI calculations
  const totalCount = deliverables.length;
  const completeCount = deliverables.filter((d) => d.status === DeliverableStatus.Complete).length;
  const inProgressCount = deliverables.filter((d) => d.status === DeliverableStatus.InProgress || d.status === DeliverableStatus.InReview).length;
  const overdueCount = deliverables.filter((d) => {
    if (d.status === DeliverableStatus.Complete) return false;
    const days = getDaysUntil(d.dueDate);
    return days !== null && days < 0;
  }).length;
  const completionPct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  const handleStatusChange = React.useCallback(
    async (deliverable: IDeliverable, newStatus: DeliverableStatus): Promise<void> => {
      try {
        const updates: Partial<IDeliverable> = { status: newStatus };
        if (newStatus === DeliverableStatus.Complete) {
          updates.completedDate = new Date().toISOString().split('T')[0];
        }
        await updateDeliverable(deliverable.id, updates);
      } catch (err) {
        console.error('Failed to update deliverable status:', err);
      } finally {
        setEditingStatusId(null);
      }
    },
    [updateDeliverable],
  );

  const handleAddDeliverable = React.useCallback(async (): Promise<void> => {
    if (!formData.name.trim()) {
      setFormError('Deliverable name is required.');
      return;
    }
    if (!formData.assignedTo.trim()) {
      setFormError('Assigned To is required.');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Due date is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await createDeliverable({
        projectCode,
        name: formData.name.trim(),
        department: formData.department,
        assignedTo: formData.assignedTo.trim(),
        status: DeliverableStatus.NotStarted,
        dueDate: formData.dueDate,
      });
      setFormData(emptyForm);
      setShowAddForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create deliverable');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, projectCode, createDeliverable]);

  const handleCancelAdd = React.useCallback((): void => {
    setShowAddForm(false);
    setFormData(emptyForm);
    setFormError(null);
  }, []);

  const columns: IDataTableColumn<IDeliverable>[] = React.useMemo(
    () => [
      {
        key: 'name',
        header: 'Deliverable Name',
        render: (d) => (
          <span style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{d.name}</span>
        ),
        width: '25%',
      },
      {
        key: 'department',
        header: 'Department',
        render: (d) => d.department,
      },
      {
        key: 'assignedTo',
        header: 'Assigned To',
        render: (d) => d.assignedTo,
      },
      {
        key: 'status',
        header: 'Status',
        render: (d) => {
          if (editingStatusId === d.id) {
            return (
              <select
                value={d.status}
                onChange={(e) => {
                  const newStatus = e.target.value as DeliverableStatus;
                  handleStatusChange(d, newStatus).catch(console.error);
                }}
                onBlur={() => setEditingStatusId(null)}
                autoFocus
                style={{
                  padding: '4px 8px',
                  fontSize: '13px',
                  borderRadius: '4px',
                  border: `1px solid ${HBC_COLORS.gray300}`,
                  backgroundColor: HBC_COLORS.white,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            );
          }

          const statusColors: Record<string, { bg: string; fg: string }> = {
            [DeliverableStatus.NotStarted]: { bg: HBC_COLORS.gray100, fg: HBC_COLORS.gray600 },
            [DeliverableStatus.InProgress]: { bg: HBC_COLORS.infoLight, fg: HBC_COLORS.info },
            [DeliverableStatus.InReview]: { bg: HBC_COLORS.warningLight, fg: HBC_COLORS.warning },
            [DeliverableStatus.Complete]: { bg: HBC_COLORS.successLight, fg: HBC_COLORS.success },
          };
          const colors = statusColors[d.status] || statusColors[DeliverableStatus.NotStarted];

          return (
            <RoleGate
              allowedRoles={[RoleName.PreconstructionTeam, RoleName.Marketing]}
              fallback={
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: colors.bg,
                    color: colors.fg,
                  }}
                >
                  {d.status}
                </span>
              }
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStatusId(d.id);
                }}
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: colors.bg,
                  color: colors.fg,
                  cursor: 'pointer',
                }}
                title="Click to change status"
              >
                {d.status}
              </span>
            </RoleGate>
          );
        },
        width: '15%',
      },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (d) => {
          const isComplete = d.status === DeliverableStatus.Complete;
          const daysUntil = getDaysUntil(d.dueDate);
          const urgencyColor = isComplete ? HBC_COLORS.success : getUrgencyColor(daysUntil);
          const daysLabel =
            isComplete
              ? 'Done'
              : daysUntil === null
              ? ''
              : daysUntil < 0
              ? `${Math.abs(daysUntil)}d overdue`
              : daysUntil === 0
              ? 'Due today'
              : `${daysUntil}d remaining`;

          return (
            <div>
              <span style={{ color: urgencyColor, fontWeight: 600 }}>
                {formatDate(d.dueDate)}
              </span>
              {daysLabel && (
                <div style={{ fontSize: '11px', color: urgencyColor, marginTop: '2px' }}>
                  {daysLabel}
                </div>
              )}
            </div>
          );
        },
        width: '15%',
      },
    ],
    [editingStatusId, handleStatusChange],
  );

  if (isLoading && deliverables.length === 0) {
    return <LoadingSpinner label="Loading deliverables..." />;
  }

  // Label styles for the form
  const formLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: HBC_COLORS.gray600,
    marginBottom: '4px',
  };
  const formInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray300}`,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <PageHeader
        title="Deliverables Tracker"
        subtitle={projectCode ? `Project: ${projectCode}` : undefined}
        actions={
          <RoleGate allowedRoles={[RoleName.PreconstructionTeam, RoleName.Marketing]}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                backgroundColor: HBC_COLORS.orange,
                color: HBC_COLORS.white,
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              + Add Deliverable
            </button>
          </RoleGate>
        }
      />

      {/* Error display */}
      {error && (
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
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ ...cardStyle, marginBottom: SPACING.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
            Overall Completion
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: HBC_COLORS.orange }}>
            {completionPct}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '10px',
            backgroundColor: HBC_COLORS.gray200,
            borderRadius: '5px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${completionPct}%`,
              height: '100%',
              backgroundColor: HBC_COLORS.orange,
              borderRadius: '5px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '6px' }}>
          {completeCount} of {totalCount} deliverables complete
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <KPICard title="Total" value={totalCount} />
        <KPICard title="Complete" value={completeCount} subtitle={totalCount > 0 ? `${completionPct}%` : undefined} />
        <KPICard title="In Progress" value={inProgressCount} />
        <KPICard
          title="Overdue"
          value={overdueCount}
          subtitle={overdueCount > 0 ? 'Requires attention' : undefined}
        />
      </div>

      {/* Add Deliverable Form */}
      {showAddForm && (
        <div
          style={{
            ...cardStyle,
            marginBottom: SPACING.lg,
            border: `2px solid ${HBC_COLORS.orange}`,
          }}
        >
          <h3
            style={{
              margin: `0 0 ${SPACING.md}`,
              fontSize: '16px',
              fontWeight: 700,
              color: HBC_COLORS.navy,
            }}
          >
            Add New Deliverable
          </h3>

          {formError && (
            <div
              style={{
                backgroundColor: HBC_COLORS.errorLight,
                color: HBC_COLORS.error,
                padding: '10px 16px',
                borderRadius: '6px',
                marginBottom: SPACING.md,
                fontSize: '13px',
              }}
            >
              {formError}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING.md,
              marginBottom: SPACING.md,
            }}
          >
            <div>
              <label style={formLabelStyle}>Deliverable Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter deliverable name"
                style={formInputStyle}
              />
            </div>
            <div>
              <label style={formLabelStyle}>Department *</label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: e.target.value as DeliverableDepartment,
                  }))
                }
                style={formInputStyle}
              >
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={formLabelStyle}>Assigned To *</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))}
                placeholder="Enter assignee name"
                style={formInputStyle}
              />
            </div>
            <div>
              <label style={formLabelStyle}>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                style={formInputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: SPACING.sm, justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancelAdd}
              disabled={isSubmitting}
              style={{
                backgroundColor: HBC_COLORS.white,
                color: HBC_COLORS.gray600,
                border: `1px solid ${HBC_COLORS.gray300}`,
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddDeliverable}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? HBC_COLORS.gray300 : HBC_COLORS.orange,
                color: HBC_COLORS.white,
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Deliverable'}
            </button>
          </div>
        </div>
      )}

      {/* Deliverables Table */}
      <DataTable<IDeliverable>
        columns={columns}
        items={deliverables}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
        emptyTitle="No deliverables"
        emptyDescription="No deliverables have been created for this project yet."
      />
    </div>
  );
};
