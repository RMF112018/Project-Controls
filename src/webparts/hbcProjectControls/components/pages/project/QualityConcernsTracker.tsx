import * as React from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { useProjectSelection } from '../../hooks/useProjectSelection';
import { useQualityConcerns } from '../../hooks/useQualityConcerns';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import { PERMISSIONS, buildBreadcrumbs, AuditAction, EntityType, QualityConcernStatus } from '@hbc/sp-services';

const STATUS_COLORS: Record<string, string> = {
  Open: HBC_COLORS.warning,
  Monitoring: '#3B82F6',
  Resolved: HBC_COLORS.success,
  Closed: HBC_COLORS.gray400,
};

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: ELEVATION.level1, marginBottom: 12 };

export const QualityConcernsTracker: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { hasPermission, dataService, currentUser } = useAppContext();
  const { concerns, isLoading, error, fetchConcerns, addConcern, updateConcern, openCount, resolvedCount } = useQualityConcerns();
  const { projectCode: activeProjectCode } = useProjectSelection();
  const projectCode = activeProjectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.QUALITY_EDIT);

  React.useEffect(() => { if (projectCode) fetchConcerns(projectCode).catch(console.error); }, [projectCode, fetchConcerns]);

  const handleAdd = React.useCallback(async () => {
    const nextLetter = String.fromCharCode(65 + concerns.length);
    await addConcern(projectCode, { letter: nextLetter, raisedBy: currentUser?.email ?? '', description: '' });
    dataService.logAudit({ Action: AuditAction.QualityConcernUpdated, EntityType: EntityType.Quality, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Added concern ${nextLetter}`, ProjectCode: projectCode }).catch(console.error);
  }, [concerns, projectCode, addConcern, dataService, currentUser]);

  const handleBlur = React.useCallback(async (concernId: number, field: string, value: string) => {
    if (!canEdit) return;
    const data: Record<string, unknown> = { [field]: value };
    if (field === 'status' && (value === 'Resolved' || value === 'Closed')) {
      data.resolvedDate = new Date().toISOString().split('T')[0];
    }
    await updateConcern(projectCode, concernId, data);
    dataService.logAudit({ Action: AuditAction.QualityConcernUpdated, EntityType: EntityType.Quality, EntityId: String(concernId), User: currentUser?.email ?? '', Details: `Updated ${field}`, ProjectCode: projectCode }).catch(console.error);
  }, [canEdit, projectCode, updateConcern, dataService, currentUser]);

  if (isLoading) return <SkeletonLoader variant="table" rows={6} columns={4} />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;

  return (
    <div>
      <PageHeader title="Quality Concerns" subtitle={projectCode} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: '8px 16px', backgroundColor: `${HBC_COLORS.warning}15`, borderRadius: 8, fontSize: 13 }}>
          <strong style={{ color: HBC_COLORS.warning }}>{openCount}</strong> <span style={{ color: HBC_COLORS.gray500 }}>Open</span>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: `${HBC_COLORS.success}15`, borderRadius: 8, fontSize: 13 }}>
          <strong style={{ color: HBC_COLORS.success }}>{resolvedCount}</strong> <span style={{ color: HBC_COLORS.gray500 }}>Resolved</span>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: `${HBC_COLORS.navy}10`, borderRadius: 8, fontSize: 13 }}>
          <strong style={{ color: HBC_COLORS.navy }}>{concerns.length}</strong> <span style={{ color: HBC_COLORS.gray500 }}>Total</span>
        </div>
        {canEdit && <button onClick={handleAdd} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ Add Concern</button>}
      </div>
      {concerns.map(c => (
        <div key={c.id} style={{ ...cardStyle, ...RISK_INDICATOR.style(STATUS_COLORS[c.status]) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: HBC_COLORS.navy, fontSize: 15 }}>{c.letter}.</div>
            {canEdit ? (
              <select defaultValue={c.status} onChange={e => handleBlur(c.id, 'status', e.target.value)} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px 8px', fontSize: 12 }}>
                {(['Open', 'Monitoring', 'Resolved', 'Closed'] as QualityConcernStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
            )}
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: HBC_COLORS.gray400 }}>Description</label>
            {canEdit ? <textarea defaultValue={c.description} onBlur={e => handleBlur(c.id, 'description', e.target.value)} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 8, fontSize: 13, minHeight: 48, resize: 'vertical' }} /> : <p style={{ margin: '4px 0', fontSize: 13 }}>{c.description}</p>}
          </div>
          {(c.status === 'Resolved' || c.status === 'Closed' || c.resolution) && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: HBC_COLORS.gray400 }}>Resolution</label>
              {canEdit ? <textarea defaultValue={c.resolution} onBlur={e => handleBlur(c.id, 'resolution', e.target.value)} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 8, fontSize: 13, minHeight: 40, resize: 'vertical' }} /> : <p style={{ margin: '4px 0', fontSize: 13 }}>{c.resolution}</p>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: HBC_COLORS.gray400 }}>
            <span>Raised: {c.raisedDate}</span>
            <span>By: {c.raisedBy.split('@')[0]}</span>
            {c.resolvedDate && <span>Resolved: {c.resolvedDate}</span>}
          </div>
        </div>
      ))}
      {concerns.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No quality concerns recorded.</div>}
    </div>
  );
};
