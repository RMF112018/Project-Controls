import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useSuperintendentPlan } from '../../hooks/useSuperintendentPlan';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { HBC_COLORS } from '../../../theme/tokens';
import { PERMISSIONS } from '../../../utils/permissions';
import { AuditAction, EntityType } from '../../../models/enums';
import { SUPERINTENDENT_PLAN_SECTIONS } from '../../../models/ISuperintendentPlan';

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden' };

export const SuperintendentPlanPage: React.FC = () => {
  const { siteContext, hasPermission, dataService, currentUser } = useAppContext();
  const { plan, isLoading, error, fetchPlan, updateSection, completionPercentage, incompleteSections } = useSuperintendentPlan();
  const projectCode = siteContext.projectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.SUPERINTENDENT_PLAN_EDIT);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  React.useEffect(() => { if (projectCode) fetchPlan(projectCode).catch(console.error); }, [projectCode, fetchPlan]);

  const toggleSection = (key: string): void => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSectionBlur = React.useCallback(async (sectionId: number, field: string, value: string | boolean) => {
    if (!canEdit) return;
    await updateSection(projectCode, sectionId, { [field]: value });
    dataService.logAudit({ Action: AuditAction.SuperPlanUpdated, EntityType: EntityType.SuperintendentPlan, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Updated section ${sectionId} ${field}`, ProjectCode: projectCode }).catch(console.error);
  }, [canEdit, projectCode, updateSection, dataService, currentUser]);

  if (isLoading) return <LoadingSpinner label="Loading superintendent plan..." />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;
  if (!plan) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No superintendent plan for this project.</div>;

  return (
    <div>
      <PageHeader title="Superintendent's Plan" subtitle={`${projectCode} — ${plan.superintendentName}`} />
      {/* Progress bar */}
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy }}>Overall Completion</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: completionPercentage === 100 ? HBC_COLORS.success : HBC_COLORS.navy }}>{completionPercentage}%</span>
        </div>
        <div style={{ height: 8, backgroundColor: HBC_COLORS.gray200, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: completionPercentage === 100 ? HBC_COLORS.success : HBC_COLORS.orange, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        {incompleteSections.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: HBC_COLORS.gray500 }}>
            Incomplete: {incompleteSections.join(', ')}
          </div>
        )}
      </div>
      {/* Sections */}
      {plan.sections.map(section => {
        const sectionDef = SUPERINTENDENT_PLAN_SECTIONS.find(s => s.key === section.sectionKey);
        const isExpanded = expandedSections.has(section.sectionKey);
        return (
          <div key={section.id} style={cardStyle}>
            <div onClick={() => toggleSection(section.sectionKey)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isExpanded ? HBC_COLORS.gray50 : '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, color: HBC_COLORS.gray400 }}>{isExpanded ? '▼' : '▶'}</span>
                <span style={{ fontWeight: 600, color: HBC_COLORS.navy, fontSize: 14 }}>{section.sectionTitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {section.isComplete && <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${HBC_COLORS.success}20`, color: HBC_COLORS.success }}>Complete</span>}
                {!section.isComplete && section.content && <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${HBC_COLORS.warning}20`, color: HBC_COLORS.warning }}>In Progress</span>}
              </div>
            </div>
            {isExpanded && (
              <div style={{ padding: '0 20px 20px' }}>
                {sectionDef && <p style={{ fontSize: 12, color: HBC_COLORS.gray400, fontStyle: 'italic', margin: '8px 0 12px' }}>{sectionDef.guidance}</p>}
                {canEdit ? (
                  <textarea defaultValue={section.content} onBlur={e => handleSectionBlur(section.id, 'content', e.target.value)} placeholder="Enter plan details..." style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 12, fontSize: 13, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }} />
                ) : (
                  <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{section.content || <span style={{ color: HBC_COLORS.gray300 }}>No content yet</span>}</div>
                )}
                {canEdit && (
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={section.isComplete} onChange={e => handleSectionBlur(section.id, 'isComplete', e.target.checked)} />
                      Mark as complete
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
