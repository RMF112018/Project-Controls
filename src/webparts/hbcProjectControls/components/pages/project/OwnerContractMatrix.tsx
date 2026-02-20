import {
  PERMISSIONS,
  AuditAction,
  EntityType,
  OWNER_CONTRACT_PARTIES,
  OwnerContractParty,
  IOwnerContractArticle
} from '@hbc/sp-services';
import * as React from 'react';
import { useResponsibilityMatrix } from '../../hooks/useResponsibilityMatrix';
import { useAppContext } from '../../contexts/AppContext';
import { useProjectSelection } from '../../hooks/useProjectSelection';
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

const inlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  fontSize: '13px',
  border: `1px solid ${HBC_COLORS.info}`,
  borderRadius: '3px',
  boxSizing: 'border-box',
  outline: 'none',
};

/* ---------- Component ---------- */
export const OwnerContractMatrix: React.FC = () => {
  const { dataService, currentUser, hasPermission } = useAppContext();
  const {
    ownerArticles,
    isLoading,
    error,
    fetchOwnerContractMatrix,
    updateOwnerArticle,
    addOwnerArticle,
    removeOwnerArticle,
  } = useResponsibilityMatrix();

  const canEdit = hasPermission(PERMISSIONS.MATRIX_EDIT);
  const { projectCode: activeProjectCode } = useProjectSelection();
  const projectCode = activeProjectCode ?? '';

  const [editingCell, setEditingCell] = React.useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newArticle, setNewArticle] = React.useState('');
  const [newPage, setNewPage] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [newParty, setNewParty] = React.useState<OwnerContractParty>('');

  /* Fetch data */
  React.useEffect(() => {
    if (projectCode) {
      fetchOwnerContractMatrix(projectCode).catch(console.error);
    }
  }, [projectCode, fetchOwnerContractMatrix]);

  /* Visible articles */
  const visibleArticles = React.useMemo(
    () => ownerArticles.filter(a => !a.isHidden),
    [ownerArticles],
  );

  /* Export data */
  const exportData = React.useMemo((): Record<string, unknown>[] => {
    return visibleArticles.map(a => ({
      'Article #': a.articleNumber,
      'Page #': a.pageNumber,
      'Responsible Party': a.responsibleParty,
      Description: a.description,
    }));
  }, [visibleArticles]);

  /* Handlers */
  const startEdit = (id: number, field: string, currentValue: string): void => {
    if (!canEdit) return;
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const commitEdit = async (): Promise<void> => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const article = ownerArticles.find(a => a.id === id);
    const prevValue = article ? (article as unknown as Record<string, string>)[field] || '' : '';
    if (editValue !== prevValue) {
      await updateOwnerArticle(projectCode, id, { [field]: editValue });
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
        Details: `Owner contract article ${article?.articleNumber || id} field "${field}" changed`,
      }).catch(console.error);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handlePartyChange = async (article: IOwnerContractArticle, value: OwnerContractParty): Promise<void> => {
    const prev = article.responsibleParty;
    await updateOwnerArticle(projectCode, article.id, { responsibleParty: value });
    dataService.logAudit({
      Action: AuditAction.MatrixAssignmentChanged,
      EntityType: EntityType.Matrix,
      EntityId: String(article.id),
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      FieldChanged: 'responsibleParty',
      PreviousValue: prev,
      NewValue: value,
      Details: `Owner contract article ${article.articleNumber} responsible party changed from "${prev}" to "${value}"`,
    }).catch(console.error);
  };

  const handleAddArticle = async (): Promise<void> => {
    if (!newArticle || !newDescription) return;
    await addOwnerArticle(projectCode, {
      articleNumber: newArticle,
      pageNumber: newPage,
      description: newDescription,
      responsibleParty: newParty,
      isCustom: true,
    });
    dataService.logAudit({
      Action: AuditAction.MatrixTaskAdded,
      EntityType: EntityType.Matrix,
      EntityId: '',
      ProjectCode: projectCode,
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: `Custom owner contract article "${newArticle}" added: "${newDescription}"`,
    }).catch(console.error);
    setNewArticle('');
    setNewPage('');
    setNewDescription('');
    setNewParty('');
    setShowAddForm(false);
  };

  const handleRemoveArticle = async (article: IOwnerContractArticle): Promise<void> => {
    await removeOwnerArticle(projectCode, article.id);
  };

  /* Render inline cell: editing or display */
  const renderEditableCell = (article: IOwnerContractArticle, field: string, value: string): React.ReactNode => {
    const isEditing = editingCell?.id === article.id && editingCell?.field === field;
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
        onClick={() => startEdit(article.id, field, value)}
        style={{ cursor: canEdit ? 'pointer' : 'default', display: 'block', minHeight: '18px' }}
        title={canEdit ? 'Click to edit' : undefined}
      >
        {value || '\u2014'}
      </span>
    );
  };

  /* Loading / Error */
  if (isLoading) return <SkeletonLoader variant="table" rows={10} columns={5} />;
  if (error) return <div style={{ color: HBC_COLORS.error, padding: '24px' }}>{error}</div>;

  return (
    <div>
      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <ExportButtons data={exportData} filename="Owner-Contract-Matrix" title="Owner Contract Matrix" />
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: '80px' }}>Article #</th>
              <th style={{ ...thStyle, minWidth: '70px' }}>Page #</th>
              <th style={{ ...thStyle, minWidth: '140px' }}>Responsible Party</th>
              <th style={{ ...thStyle, minWidth: '300px' }}>Description</th>
              {canEdit && <th style={{ ...thStyle, width: '32px' }} />}
            </tr>
          </thead>
          <tbody>
            {visibleArticles.map(article => (
              <tr key={article.id}>
                <td style={tdStyle}>
                  {renderEditableCell(article, 'articleNumber', article.articleNumber)}
                </td>
                <td style={tdStyle}>
                  {renderEditableCell(article, 'pageNumber', article.pageNumber)}
                </td>
                <td style={tdStyle}>
                  {canEdit ? (
                    <select
                      value={article.responsibleParty}
                      onChange={e => handlePartyChange(article, e.target.value as OwnerContractParty)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '13px',
                        border: `1px solid ${HBC_COLORS.gray300}`,
                        borderRadius: '3px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {OWNER_CONTRACT_PARTIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label || '\u2014'}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{article.responsibleParty || '\u2014'}</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {renderEditableCell(article, 'description', article.description)}
                </td>
                {canEdit && (
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span
                      onClick={() => handleRemoveArticle(article)}
                      style={{ cursor: 'pointer', color: HBC_COLORS.error, fontSize: '14px', fontWeight: 700 }}
                      title="Hide article"
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

      {/* Legend */}
      <div style={{ ...cardStyle, display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: HBC_COLORS.gray600 }}>
        <span><strong>O</strong> = Owner Activity</span>
        <span><strong>A/E</strong> = Architect/Engineer Activity</span>
        <span><strong>C</strong> = Contractor Activity</span>
      </div>

      {/* Add Article */}
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
              + Add Article
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Article #
                </label>
                <input
                  type="text"
                  value={newArticle}
                  onChange={e => setNewArticle(e.target.value)}
                  placeholder="e.g. 21"
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
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Page #
                </label>
                <input
                  type="text"
                  value={newPage}
                  onChange={e => setNewPage(e.target.value)}
                  placeholder="e.g. 45"
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
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                  Responsible Party
                </label>
                <select
                  value={newParty}
                  onChange={e => setNewParty(e.target.value as OwnerContractParty)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    border: `1px solid ${HBC_COLORS.gray300}`,
                    borderRadius: '4px',
                  }}
                >
                  {OWNER_CONTRACT_PARTIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label || 'Select...'}</option>
                  ))}
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
                  placeholder="Article description"
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
                onClick={handleAddArticle}
                disabled={!newArticle || !newDescription}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: HBC_COLORS.white,
                  backgroundColor: !newArticle || !newDescription ? HBC_COLORS.gray400 : HBC_COLORS.navy,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !newArticle || !newDescription ? 'not-allowed' : 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewArticle(''); setNewPage(''); setNewDescription(''); setNewParty(''); }}
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
