import * as React from 'react';
import { useResponsibilityMatrix } from '../../hooks/useResponsibilityMatrix';
import { useAppContext } from '../../contexts/AppContext';
import { PERMISSIONS } from '../../../utils/permissions';
import {
  SUB_ROLE_COLUMNS,
  SUB_ROLE_LABELS,
  ASSIGNMENT_CYCLE,
  MatrixAssignment,
  ISubContractClause,
} from '../../../models/IResponsibilityMatrix';
import { AuditAction, EntityType } from '../../../models';
import { ExportButtons } from '../../shared/ExportButtons';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { HBC_COLORS } from '../../../theme/tokens';

/* ---------- Styles ---------- */
const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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

const inlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  fontSize: '13px',
  border: `1px solid ${HBC_COLORS.info}`,
  borderRadius: '3px',
  boxSizing: 'border-box',
  outline: 'none',
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

/* ---------- Component ---------- */
export const SubContractMatrix: React.FC = () => {
  const { dataService, currentUser, siteContext, hasPermission } = useAppContext();
  const {
    subClauses,
    isLoading,
    error,
    fetchSubContractMatrix,
    updateSubClause,
    addSubClause,
    removeSubClause,
  } = useResponsibilityMatrix();

  const canEdit = hasPermission(PERMISSIONS.MATRIX_EDIT);
  const projectCode = siteContext.projectCode || '';

  const [editingCell, setEditingCell] = React.useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newRef, setNewRef] = React.useState('');
  const [newPage, setNewPage] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');

  /* Fetch data */
  React.useEffect(() => {
    if (projectCode) {
      fetchSubContractMatrix(projectCode).catch(console.error);
    }
  }, [projectCode, fetchSubContractMatrix]);

  /* Visible clauses */
  const visibleClauses = React.useMemo(
    () => subClauses.filter(c => !c.isHidden),
    [subClauses],
  );

  /* Export data */
  const exportData = React.useMemo((): Record<string, unknown>[] => {
    return visibleClauses.map(c => {
      const row: Record<string, unknown> = {
        'Ref. #': c.refNumber,
        'Page #': c.pageNumber,
        'Clause Description': c.clauseDescription,
      };
      SUB_ROLE_COLUMNS.forEach(col => {
        row[SUB_ROLE_LABELS[col]] = c[col as keyof ISubContractClause] || '';
      });
      return row;
    });
  }, [visibleClauses]);

  /* Handlers — role cell click */
  const handleRoleCellClick = async (clause: ISubContractClause, roleCol: string): Promise<void> => {
    if (!canEdit) return;
    const current = clause[roleCol as keyof ISubContractClause] as MatrixAssignment;
    const next = nextAssignment(current);
    await updateSubClause(projectCode, clause.id, { [roleCol]: next });
    dataService.logAudit({
      Action: AuditAction.MatrixAssignmentChanged,
      EntityType: EntityType.Matrix,
      EntityId: String(clause.id),
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      FieldChanged: roleCol,
      PreviousValue: current,
      NewValue: next,
      Details: `Sub-contract clause "${clause.clauseDescription}" role ${roleCol} changed from "${current}" to "${next}"`,
    }).catch(console.error);
  };

  /* Handlers — inline text editing */
  const startEdit = (id: number, field: string, currentValue: string): void => {
    if (!canEdit) return;
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const commitEdit = async (): Promise<void> => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const clause = subClauses.find(c => c.id === id);
    const prevValue = clause ? (clause as unknown as Record<string, string>)[field] || '' : '';
    if (editValue !== prevValue) {
      await updateSubClause(projectCode, id, { [field]: editValue });
      dataService.logAudit({
        Action: AuditAction.MatrixAssignmentChanged,
        EntityType: EntityType.Matrix,
        EntityId: String(id),
        ProjectCode: projectCode,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        FieldChanged: field,
        PreviousValue: prevValue,
        NewValue: editValue,
        Details: `Sub-contract clause ${clause?.refNumber || id} field "${field}" changed`,
      }).catch(console.error);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const renderEditableCell = (clause: ISubContractClause, field: string, value: string): React.ReactNode => {
    const isEditing = editingCell?.id === clause.id && editingCell?.field === field;
    if (isEditing) {
      return (
        <input
          autoFocus
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); }}
          style={inlineInputStyle}
        />
      );
    }
    return (
      <span
        onClick={() => startEdit(clause.id, field, value)}
        style={{ cursor: canEdit ? 'pointer' : 'default', display: 'block', minHeight: '18px' }}
        title={canEdit ? 'Click to edit' : undefined}
      >
        {value || '\u2014'}
      </span>
    );
  };

  /* Add clause */
  const handleAddClause = async (): Promise<void> => {
    if (!newRef || !newDescription) return;
    await addSubClause(projectCode, {
      refNumber: newRef,
      pageNumber: newPage,
      clauseDescription: newDescription,
      isCustom: true,
    });
    dataService.logAudit({
      Action: AuditAction.MatrixTaskAdded,
      EntityType: EntityType.Matrix,
      EntityId: '',
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: `Custom sub-contract clause "${newRef}" added: "${newDescription}"`,
    }).catch(console.error);
    setNewRef('');
    setNewPage('');
    setNewDescription('');
    setShowAddForm(false);
  };

  const handleRemoveClause = async (clause: ISubContractClause): Promise<void> => {
    await removeSubClause(projectCode, clause.id);
  };

  /* Loading / Error */
  if (isLoading) return <LoadingSpinner label="Loading sub-contract matrix..." />;
  if (error) return <div style={{ color: HBC_COLORS.error, padding: '24px' }}>{error}</div>;

  return (
    <div>
      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <ExportButtons data={exportData} filename="Sub-Contract-Matrix" title="Sub-Contract Matrix" />
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: '80px' }}>Ref. #</th>
              <th style={{ ...thStyle, minWidth: '70px' }}>Page #</th>
              <th style={{ ...thStyle, minWidth: '250px' }}>Clause Description</th>
              {SUB_ROLE_COLUMNS.map(col => (
                <th key={col} style={{ ...thStyle, textAlign: 'center', minWidth: '80px' }}>
                  {SUB_ROLE_LABELS[col]}
                </th>
              ))}
              {canEdit && <th style={{ ...thStyle, width: '32px' }} />}
            </tr>
          </thead>
          <tbody>
            {visibleClauses.map(clause => (
              <tr key={clause.id}>
                <td style={tdStyle}>
                  {renderEditableCell(clause, 'refNumber', clause.refNumber)}
                </td>
                <td style={tdStyle}>
                  {renderEditableCell(clause, 'pageNumber', clause.pageNumber)}
                </td>
                <td style={tdStyle}>
                  {renderEditableCell(clause, 'clauseDescription', clause.clauseDescription)}
                </td>
                {SUB_ROLE_COLUMNS.map(col => {
                  const val = clause[col as keyof ISubContractClause] as MatrixAssignment;
                  return (
                    <td
                      key={col}
                      style={canEdit ? getAssignmentCellStyle(val) : { ...getAssignmentCellStyle(val), cursor: 'default' }}
                      onClick={() => handleRoleCellClick(clause, col)}
                      title={canEdit ? 'Click to cycle assignment' : undefined}
                    >
                      {val || ''}
                    </td>
                  );
                })}
                {canEdit && (
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      onClick={() => handleRemoveClause(clause)}
                      style={{ cursor: 'pointer', color: HBC_COLORS.error, fontSize: '14px', fontWeight: 700 }}
                      title="Hide clause"
                    >
                      &times;
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Clause */}
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
              + Add Clause
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Ref. #
                </label>
                <input
                  type="text"
                  value={newRef}
                  onChange={e => setNewRef(e.target.value)}
                  placeholder="e.g. SC-21"
                  style={{
                    width: '100px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    border: `1px solid ${HBC_COLORS.gray300}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Page #
                </label>
                <input
                  type="text"
                  value={newPage}
                  onChange={e => setNewPage(e.target.value)}
                  placeholder="e.g. 12"
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    border: `1px solid ${HBC_COLORS.gray300}`,
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Clause Description
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Clause description"
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
                onClick={handleAddClause}
                disabled={!newRef || !newDescription}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: HBC_COLORS.white,
                  backgroundColor: !newRef || !newDescription ? HBC_COLORS.gray400 : HBC_COLORS.navy,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !newRef || !newDescription ? 'not-allowed' : 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewRef(''); setNewPage(''); setNewDescription(''); }}
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
