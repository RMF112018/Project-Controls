import * as React from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { useProjectSelection } from '../../hooks/useProjectSelection';
import { useSafetyConcerns } from '../../hooks/useSafetyConcerns';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import {
  PERMISSIONS,
  buildBreadcrumbs,
  AuditAction,
  EntityType,
  SafetyConcernStatus,
  SafetyConcernSeverity
} from '@hbc/sp-services';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: HBC_COLORS.warning,
  Low: '#3B82F6',
};

const STATUS_COLORS: Record<string, string> = {
  Open: HBC_COLORS.warning,
  Monitoring: '#3B82F6',
  Resolved: HBC_COLORS.success,
  Closed: HBC_COLORS.gray400,
};

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: ELEVATION.level1, marginBottom: 12 };

export const SafetyConcernsTracker: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { hasPermission, dataService, currentUser } = useAppContext();
  const { concerns, isLoading, error, safetyOfficer, fetchConcerns, addConcern, updateConcern } = useSafetyConcerns();
  const { projectCode: activeProjectCode } = useProjectSelection();
  const projectCode = activeProjectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.SAFETY_EDIT);

  React.useEffect(() => { if (projectCode) fetchConcerns(projectCode).catch(console.error); }, [projectCode, fetchConcerns]);

  const handleAdd = React.useCallback(async () => {
    const nextLetter = String.fromCharCode(65 + concerns.length);
    await addConcern(projectCode, {
      letter: nextLetter,
      raisedBy: currentUser?.email ?? '',
      safetyOfficerName: safetyOfficer?.name ?? '',
      safetyOfficerEmail: safetyOfficer?.email ?? '',
      severity: 'Medium',
    });
    dataService.logAudit({ Action: AuditAction.SafetyConcernUpdated, EntityType: EntityType.Safety, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Added concern ${nextLetter}`, ProjectCode: projectCode }).catch(console.error);
  }, [concerns, projectCode, addConcern, safetyOfficer, dataService, currentUser]);

  const handleBlur = React.useCallback(async (concernId: number, field: string, value: string) => {
    if (!canEdit) return;
    const data: Record<string, unknown> = { [field]: value };
    if (field === 'status' && (value === 'Resolved' || value === 'Closed')) {
      data.resolvedDate = new Date().toISOString().split('T')[0];
    }
    await updateConcern(projectCode, concernId, data);
    dataService.logAudit({ Action: AuditAction.SafetyConcernUpdated, EntityType: EntityType.Safety, EntityId: String(concernId), User: currentUser?.email ?? '', Details: `Updated ${field}`, ProjectCode: projectCode }).catch(console.error);
  }, [canEdit, projectCode, updateConcern, dataService, currentUser]);

  if (isLoading) return <SkeletonLoader variant="table" rows={6} columns={4} />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;

  return (
    <div>
      <PageHeader title="Safety Concerns" subtitle={projectCode} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      {safetyOfficer && (
        <div style={{ ...cardStyle, ...RISK_INDICATOR.style(HBC_COLORS.navy) }}>
          <h3 style={{ margin: '0 0 8px', color: HBC_COLORS.navy, fontSize: 14 }}>Safety Officer</h3>
          <div style={{ fontSize: 14 }}>{safetyOfficer.name}</div>
          <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>{safetyOfficer.email}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['Critical', 'High', 'Medium', 'Low'] as SafetyConcernSeverity[]).map(sev => {
          const count = concerns.filter(c => c.severity === sev && c.status !== 'Closed' && c.status !== 'Resolved').length;
          return (
            <div key={sev} style={{ padding: '6px 12px', backgroundColor: `${SEVERITY_COLORS[sev]}15`, borderRadius: 8, fontSize: 12 }}>
              <strong style={{ color: SEVERITY_COLORS[sev] }}>{count}</strong> <span style={{ color: HBC_COLORS.gray500 }}>{sev}</span>
            </div>
          );
        })}
        {canEdit && <button onClick={handleAdd} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ Add Concern</button>}
      </div>
      {concerns.map(c => (
        <div key={c.id} style={{ ...cardStyle, ...RISK_INDICATOR.style(SEVERITY_COLORS[c.severity]) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: HBC_COLORS.navy, fontSize: 15 }}>{c.letter}.</span>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, backgroundColor: `${SEVERITY_COLORS[c.severity]}20`, color: SEVERITY_COLORS[c.severity] }}>{c.severity}</span>
            </div>
            {canEdit ? (
              <select defaultValue={c.status} onChange={e => handleBlur(c.id, 'status', e.target.value)} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px 8px', fontSize: 12 }}>
                {(['Open', 'Monitoring', 'Resolved', 'Closed'] as SafetyConcernStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
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
          </div>
        </div>
      ))}
      {concerns.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No safety concerns recorded.</div>}
    </div>
  );
};
