import {
  PERMISSIONS,
  AuditAction,
  EntityType,
  MATRIX_ROLE_COLUMNS,
  MATRIX_ROLE_LABELS,
  ASSIGNMENT_CYCLE,
  MatrixAssignment,
  IInternalMatrixTask
} from '@hbc/sp-services';
import * as React from 'react';
import { useResponsibilityMatrix } from '../../hooks/useResponsibilityMatrix';
import { useAppContext } from '../../contexts/AppContext';
import { ExportButtons } from '../../shared/ExportButtons';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

/* ---------- Styles ---------- */
const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  boxShadow: ELEVATION.level1,
  padding: '24px',
  marginBottom: '16px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${HBC_COLORS.gray200}`,
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: HBC_COLORS.gray600,
  backgroundColor: HBC_COLORS.gray50,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${HBC_COLORS.gray200}`,
  fontSize: '13px',
  color: HBC_COLORS.gray800,
};

function getAssignmentCellStyle(value: MatrixAssignment): React.CSSProperties {
  const base: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'center',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '11px',
    minWidth: '60px',
    userSelect: 'none',
  };
  switch (value) {
    case 'X':
      return { ...base, backgroundColor: HBC_COLORS.navy, color: HBC_COLORS.white };
    case 'Support':
      return { ...base, backgroundColor: HBC_COLORS.info, color: HBC_COLORS.white };
    case 'Sign-Off':
      return { ...base, backgroundColor: HBC_COLORS.orange, color: HBC_COLORS.white };
    case 'Review':
      return { ...base, backgroundColor: HBC_COLORS.gray200, color: HBC_COLORS.gray800 };
    default:
      return { ...base, backgroundColor: HBC_COLORS.white };
  }
}

function nextAssignment(current: MatrixAssignment): MatrixAssignment {
  const idx = ASSIGNMENT_CYCLE.indexOf(current);
  return ASSIGNMENT_CYCLE[(idx + 1) % ASSIGNMENT_CYCLE.length];
}

/* ---------- Unique task categories preserving original order ---------- */
function getOrderedCategories(tasks: IInternalMatrixTask[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  tasks.forEach(t => {
    if (!t.isHidden && !seen.has(t.taskCategory)) {
      seen.add(t.taskCategory);
      result.push(t.taskCategory);
    }
  });
  return result;
}

/* ---------- Component ---------- */
export const InternalResponsibilityMatrix: React.FC = () => {
  const { dataService, currentUser, selectedProject, hasPermission } = useAppContext();
  const {
    internalTasks,
    teamAssignments,
    isLoading,
    error,
    fetchInternalMatrix,
    fetchTeamAssignments,
    updateInternalTask,
    addInternalTask,
    removeInternalTask,
    updateTeamAssignment,
  } = useResponsibilityMatrix();

  const canEdit = hasPermission(PERMISSIONS.MATRIX_EDIT);
  const projectCode = selectedProject?.projectCode || '';

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [teamDraft, setTeamDraft] = React.useState<Record<string, string>>({});

  /* Fetch data */
  React.useEffect(() => {
    if (projectCode) {
      fetchInternalMatrix(projectCode).catch(console.error);
      fetchTeamAssignments(projectCode).catch(console.error);
    }
  }, [projectCode, fetchInternalMatrix, fetchTeamAssignments]);

  /* Build lookup from teamAssignments array */
  const teamMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    teamAssignments.forEach(a => {
      m[a.roleAbbreviation] = a.assignedPerson;
    });
    return m;
  }, [teamAssignments]);

  /* Sync team draft when fresh data arrives */
  React.useEffect(() => {
    const draft: Record<string, string> = {};
    MATRIX_ROLE_COLUMNS.forEach(col => {
      draft[col] = teamMap[col] || '';
    });
    setTeamDraft(draft);
  }, [teamMap]);

  /* Visible tasks only */
  const visibleTasks = React.useMemo(
    () => internalTasks.filter(t => !t.isHidden),
    [internalTasks],
  );

  const categories = React.useMemo(() => getOrderedCategories(visibleTasks), [visibleTasks]);

  /* Export data */
  const exportData = React.useMemo((): Record<string, unknown>[] => {
    return visibleTasks.map(t => {
      const row: Record<string, unknown> = {
        Category: t.taskCategory,
        'Task Description': t.taskDescription,
      };
      MATRIX_ROLE_COLUMNS.forEach(col => {
        row[MATRIX_ROLE_LABELS[col]] = t[col as keyof IInternalMatrixTask] || '';
      });
      return row;
    });
  }, [visibleTasks]);

  /* Handlers */
  const handleCellClick = async (task: IInternalMatrixTask, roleCol: string): Promise<void> => {
    if (!canEdit) return;
    const current = task[roleCol as keyof IInternalMatrixTask] as MatrixAssignment;
    const next = nextAssignment(current);
    await updateInternalTask(projectCode, task.id, { [roleCol]: next });
    dataService.logAudit({
      Action: AuditAction.MatrixAssignmentChanged,
      EntityType: EntityType.Matrix,
      EntityId: String(task.id),
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      FieldChanged: roleCol,
      PreviousValue: current,
      NewValue: next,
      Details: `Internal matrix task "${task.taskDescription}" role ${roleCol} changed from "${current}" to "${next}"`,
    }).catch(console.error);
  };

  const handleTeamBlur = async (role: string): Promise<void> => {
    if (!canEdit) return;
    const value = teamDraft[role] || '';
    if (value !== (teamMap[role] || '')) {
      await updateTeamAssignment(projectCode, role, value);
    }
  };

  const handleAddTask = async (): Promise<void> => {
    if (!newCategory || !newDescription) return;
    await addInternalTask(projectCode, {
      taskCategory: newCategory,
      taskDescription: newDescription,
      isCustom: true,
    });
    dataService.logAudit({
      Action: AuditAction.MatrixTaskAdded,
      EntityType: EntityType.Matrix,
      EntityId: '',
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: `Custom internal task "${newDescription}" added to category "${newCategory}"`,
    }).catch(console.error);
    setNewCategory('');
    setNewDescription('');
    setShowAddForm(false);
  };

  const handleRemoveTask = async (task: IInternalMatrixTask): Promise<void> => {
    await removeInternalTask(projectCode, task.id);
  };

  /* Loading / Error */
  if (isLoading) return <SkeletonLoader variant="table" rows={10} columns={7} />;
  if (error) return <div style={{ color: HBC_COLORS.error, padding: '24px' }}>{error}</div>;

  return (
    <div>
      {/* Team Assignment Section */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>
          Team Assignments
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {MATRIX_ROLE_COLUMNS.map(col => (
            <div key={col}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                {MATRIX_ROLE_LABELS[col]}
              </label>
              <input
                type="text"
                value={teamDraft[col] || ''}
                disabled={!canEdit}
                onChange={e => setTeamDraft(prev => ({ ...prev, [col]: e.target.value }))}
                onBlur={() => handleTeamBlur(col)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '13px',
                  border: `1px solid ${HBC_COLORS.gray300}`,
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  backgroundColor: canEdit ? HBC_COLORS.white : HBC_COLORS.gray50,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <ExportButtons data={exportData} filename="Internal-Responsibility-Matrix" title="Internal Responsibility Matrix" />
      </div>

      {/* Matrix Table */}
      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: '250px' }}>Task Description</th>
              {MATRIX_ROLE_COLUMNS.map(col => (
                <th key={col} style={{ ...thStyle, textAlign: 'center', minWidth: '80px' }}>
                  <div>{col === 'QAQC' ? 'QA/QC' : col === 'SrPM' ? 'Sr. PM' : col}</div>
                  <div style={{ fontWeight: 400, fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '2px' }}>
                    {teamMap[col] || '\u2014'}
                  </div>
                </th>
              ))}
              {canEdit && <th style={{ ...thStyle, width: '32px' }} />}
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const catTasks = visibleTasks.filter(t => t.taskCategory === cat);
              return (
                <React.Fragment key={cat}>
                  {/* Category header */}
                  <tr>
                    <td
                      colSpan={MATRIX_ROLE_COLUMNS.length + 1 + (canEdit ? 1 : 0)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: HBC_COLORS.navy,
                        color: HBC_COLORS.white,
                        fontWeight: 600,
                        fontSize: '13px',
                        borderBottom: `1px solid ${HBC_COLORS.gray200}`,
                      }}
                    >
                      {cat}
                    </td>
                  </tr>
                  {/* Task rows */}
                  {catTasks.map(task => (
                    <tr key={task.id}>
                      <td style={tdStyle}>{task.taskDescription}</td>
                      {MATRIX_ROLE_COLUMNS.map(col => {
                        const val = task[col as keyof IInternalMatrixTask] as MatrixAssignment;
                        return (
                          <td
                            key={col}
                            style={canEdit ? getAssignmentCellStyle(val) : { ...getAssignmentCellStyle(val), cursor: 'default' }}
                            onClick={() => handleCellClick(task, col)}
                            title={canEdit ? 'Click to cycle assignment' : undefined}
                          >
                            {val || ''}
                          </td>
                        );
                      })}
                      {canEdit && (
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span
                            onClick={() => handleRemoveTask(task)}
                            style={{ cursor: 'pointer', color: HBC_COLORS.error, fontSize: '14px', fontWeight: 700 }}
                            title="Hide task"
                          >
                            &times;
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Task */}
      {canEdit && (
        <div style={cardStyle}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: HBC_COLORS.white,
                backgroundColor: HBC_COLORS.navy,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + Add Task
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    border: `1px solid ${HBC_COLORS.gray300}`,
                    borderRadius: '4px',
                  }}
                >
                  <option value="">Select...</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Task description"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '13px',
                    border: `1px solid ${HBC_COLORS.gray300}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={handleAddTask}
                disabled={!newCategory || !newDescription}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: HBC_COLORS.white,
                  backgroundColor: !newCategory || !newDescription ? HBC_COLORS.gray400 : HBC_COLORS.navy,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !newCategory || !newDescription ? 'not-allowed' : 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewCategory(''); setNewDescription(''); }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: HBC_COLORS.gray600,
                  backgroundColor: HBC_COLORS.gray100,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
