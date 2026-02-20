import * as React from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { useProjectSelection } from '../../hooks/useProjectSelection';
import { useProjectSchedule } from '../../hooks/useProjectSchedule';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { PERMISSIONS, buildBreadcrumbs, AuditAction, EntityType } from '@hbc/sp-services';

const STATUS_COLORS: Record<string, string> = { Active: HBC_COLORS.error, Monitoring: '#3B82F6', Resolved: HBC_COLORS.success };
const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: ELEVATION.level1, marginBottom: 16 };

export const ProjectScheduleCriticalPath: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { hasPermission, dataService, currentUser } = useAppContext();
  const { schedule, isLoading, error, fetchSchedule, updateSchedule, addCriticalPathItem, daysToCompletion } = useProjectSchedule();
  const { projectCode: activeProjectCode } = useProjectSelection();
  const projectCode = activeProjectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.SCHEDULE_EDIT);

  React.useEffect(() => { if (projectCode) fetchSchedule(projectCode).catch(console.error); }, [projectCode, fetchSchedule]);

  const handleFieldBlur = React.useCallback(async (field: string, value: string | boolean | number | null) => {
    if (!canEdit || !schedule) return;
    await updateSchedule(projectCode, { [field]: value });
    dataService.logAudit({ Action: AuditAction.ScheduleUpdated, EntityType: EntityType.Schedule, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Updated ${field}`, ProjectCode: projectCode }).catch(console.error);
  }, [canEdit, schedule, projectCode, updateSchedule, dataService, currentUser]);

  const handleAddConcern = React.useCallback(async () => {
    if (!schedule) return;
    const nextLetter = String.fromCharCode(65 + schedule.criticalPathConcerns.length);
    await addCriticalPathItem(projectCode, { letter: nextLetter });
    dataService.logAudit({ Action: AuditAction.ScheduleUpdated, EntityType: EntityType.Schedule, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Added critical path item ${nextLetter}`, ProjectCode: projectCode }).catch(console.error);
  }, [schedule, projectCode, addCriticalPathItem, dataService, currentUser]);

  if (isLoading) return <SkeletonLoader variant="card" />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;
  if (!schedule) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No schedule data for this project.</div>;

  const inputStyle: React.CSSProperties = { border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '6px 8px', fontSize: 13, width: '100%' };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: HBC_COLORS.gray500, display: 'block', marginBottom: 4 };

  return (
    <div>
      <PageHeader title="Schedule & Critical Path" subtitle={projectCode} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      {daysToCompletion !== null && (
        <div style={{ ...cardStyle, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: daysToCompletion > 90 ? HBC_COLORS.success : daysToCompletion > 30 ? HBC_COLORS.warning : HBC_COLORS.error }}>{daysToCompletion}</div>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>Days to Substantial Completion</div><div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Target: {schedule.substantialCompletionDate}</div></div>
        </div>
      )}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy, fontSize: 16 }}>Key Dates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Start Date', field: 'startDate', value: schedule.startDate },
            { label: 'Substantial Completion', field: 'substantialCompletionDate', value: schedule.substantialCompletionDate },
            { label: 'NTP Date', field: 'ntpDate', value: schedule.ntpDate },
            { label: 'NOC Date', field: 'nocDate', value: schedule.nocDate },
          ].map(d => (
            <div key={d.field}>
              <label style={labelStyle}>{d.label}</label>
              {canEdit ? <input type="date" defaultValue={d.value ?? ''} onBlur={e => handleFieldBlur(d.field, e.target.value || null)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>{d.value ?? '-'}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Contract Calendar Days</label>
            {canEdit ? <input type="number" defaultValue={schedule.contractCalendarDays ?? ''} onBlur={e => handleFieldBlur('contractCalendarDays', e.target.value ? parseInt(e.target.value) : null)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>{schedule.contractCalendarDays ?? '-'}</span>}
          </div>
          <div>
            <label style={labelStyle}>Basis Type</label>
            {canEdit ? <input defaultValue={schedule.contractBasisType} onBlur={e => handleFieldBlur('contractBasisType', e.target.value)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>{schedule.contractBasisType}</span>}
          </div>
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy, fontSize: 16 }}>Team Goal</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Days Ahead</label>
            {canEdit ? <input type="number" defaultValue={schedule.teamGoalDaysAhead ?? ''} onBlur={e => handleFieldBlur('teamGoalDaysAhead', e.target.value ? parseInt(e.target.value) : null)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>{schedule.teamGoalDaysAhead ?? '-'}</span>}
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            {canEdit ? <input defaultValue={schedule.teamGoalDescription} onBlur={e => handleFieldBlur('teamGoalDescription', e.target.value)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>{schedule.teamGoalDescription}</span>}
          </div>
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy, fontSize: 16 }}>Liquidated Damages</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" checked={schedule.hasLiquidatedDamages} onChange={e => handleFieldBlur('hasLiquidatedDamages', e.target.checked)} disabled={!canEdit} style={{ marginRight: 8 }} />
            Liquidated Damages Apply
          </label>
        </div>
        {schedule.hasLiquidatedDamages && (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Amount (per day)</label>
              {canEdit ? <input type="number" defaultValue={schedule.liquidatedDamagesAmount ?? ''} onBlur={e => handleFieldBlur('liquidatedDamagesAmount', e.target.value ? parseFloat(e.target.value) : null)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>${schedule.liquidatedDamagesAmount?.toLocaleString() ?? '-'}</span>}
            </div>
            <div>
              <label style={labelStyle}>Terms</label>
              {canEdit ? <input defaultValue={schedule.liquidatedDamagesTerms} onBlur={e => handleFieldBlur('liquidatedDamagesTerms', e.target.value)} style={inputStyle} /> : <span style={{ fontSize: 14 }}>{schedule.liquidatedDamagesTerms}</span>}
            </div>
          </div>
        )}
      </div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: HBC_COLORS.navy, fontSize: 16 }}>Critical Path Concerns</h3>
          {canEdit && <button onClick={handleAddConcern} style={{ padding: '6px 12px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ Add</button>}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
              <th style={{ textAlign: 'left', padding: '8px 4px', width: 40 }}>#</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Description</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Impact</th>
              <th style={{ textAlign: 'center', padding: '8px 4px', width: 100 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>Mitigation Plan</th>
            </tr>
          </thead>
          <tbody>
            {schedule.criticalPathConcerns.map(item => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                <td style={{ padding: '8px 4px', fontWeight: 600 }}>{item.letter}</td>
                <td style={{ padding: '8px 4px' }}>{item.description || <span style={{ color: HBC_COLORS.gray300 }}>Enter description...</span>}</td>
                <td style={{ padding: '8px 4px', fontSize: 12 }}>{item.impactDescription}</td>
                <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${STATUS_COLORS[item.status]}20`, color: STATUS_COLORS[item.status] }}>{item.status}</span>
                </td>
                <td style={{ padding: '8px 4px', fontSize: 12 }}>{item.mitigationPlan}</td>
              </tr>
            ))}
            {schedule.criticalPathConcerns.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: HBC_COLORS.gray400 }}>No critical path concerns</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
