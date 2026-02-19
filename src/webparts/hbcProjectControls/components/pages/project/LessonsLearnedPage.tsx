import * as React from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { useLessonsLearned } from '../../hooks/useLessonsLearned';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import {
  PERMISSIONS,
  buildBreadcrumbs,
  AuditAction,
  EntityType,
  LessonCategory,
  LessonImpact
} from '@hbc/sp-services';

const CATEGORY_COLORS: Record<string, string> = {
  Cost: '#10B981', Schedule: '#3B82F6', Quality: '#8B5CF6', Safety: '#EF4444',
  Communication: '#F59E0B', Subcontractor: '#EC4899', Design: '#6366F1', Client: '#14B8A6', Other: '#6B7280',
};
const IMPACT_COLORS: Record<string, string> = { Positive: HBC_COLORS.success, Negative: HBC_COLORS.error, Neutral: HBC_COLORS.gray500 };
const ALL_CATEGORIES: LessonCategory[] = ['Cost', 'Schedule', 'Quality', 'Safety', 'Communication', 'Subcontractor', 'Design', 'Client', 'Other'];
const ALL_IMPACTS: LessonImpact[] = ['Positive', 'Negative', 'Neutral'];

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: ELEVATION.level1, marginBottom: 12 };

export const LessonsLearnedPage: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, hasPermission, dataService, currentUser } = useAppContext();
  const { lessons, isLoading, error, fetchLessons, addLesson, updateLesson } = useLessonsLearned();
  const projectCode = selectedProject?.projectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.LESSONS_EDIT);
  const [filterCategory, setFilterCategory] = React.useState<string>('');
  const [filterImpact, setFilterImpact] = React.useState<string>('');
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newCategory, setNewCategory] = React.useState<LessonCategory>('Other');
  const [newImpact, setNewImpact] = React.useState<LessonImpact>('Neutral');
  const [newDescription, setNewDescription] = React.useState('');
  const [newRecommendation, setNewRecommendation] = React.useState('');

  React.useEffect(() => { if (projectCode) fetchLessons(projectCode).catch(console.error); }, [projectCode, fetchLessons]);

  const filtered = React.useMemo(() => {
    return lessons.filter(l => {
      if (filterCategory && l.category !== filterCategory) return false;
      if (filterImpact && l.impact !== filterImpact) return false;
      return true;
    });
  }, [lessons, filterCategory, filterImpact]);

  const handleAdd = React.useCallback(async () => {
    if (!newTitle.trim()) return;
    await addLesson(projectCode, { title: newTitle, category: newCategory, impact: newImpact, description: newDescription, recommendation: newRecommendation, raisedBy: currentUser?.email ?? '' });
    dataService.logAudit({ Action: AuditAction.LessonAdded, EntityType: EntityType.LessonLearned, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Added: ${newTitle}`, ProjectCode: projectCode }).catch(console.error);
    setNewTitle(''); setNewDescription(''); setNewRecommendation(''); setShowAddForm(false);
  }, [newTitle, newCategory, newImpact, newDescription, newRecommendation, projectCode, addLesson, dataService, currentUser]);

  const handleToggleFinal = React.useCallback(async (lessonId: number, current: boolean) => {
    await updateLesson(projectCode, lessonId, { isIncludedInFinalRecord: !current });
  }, [projectCode, updateLesson]);

  if (isLoading) return <SkeletonLoader variant="table" rows={6} columns={4} />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;

  const inputStyle: React.CSSProperties = { border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '8px', fontSize: 13, width: '100%' };

  return (
    <div>
      <PageHeader title="Lessons Learned" subtitle={projectCode} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '6px 8px', fontSize: 13 }}>
          <option value="">All Categories</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterImpact} onChange={e => setFilterImpact(e.target.value)} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '6px 8px', fontSize: 13 }}>
          <option value="">All Impacts</option>
          {ALL_IMPACTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <span style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>{filtered.length} of {lessons.length} lessons</span>
        {canEdit && <button onClick={() => setShowAddForm(true)} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ Add Lesson</button>}
      </div>
      {/* Add form */}
      {showAddForm && (
        <div style={{ ...cardStyle, ...RISK_INDICATOR.style(HBC_COLORS.orange) }}>
          <h4 style={{ margin: '0 0 12px', color: HBC_COLORS.navy }}>New Lesson Learned</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" style={inputStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as LessonCategory)} style={inputStyle}>
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newImpact} onChange={e => setNewImpact(e.target.value as LessonImpact)} style={inputStyle}>
                {ALL_IMPACTS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Description" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
            <textarea value={newRecommendation} onChange={e => setNewRecommendation(e.target.value)} placeholder="Recommendation" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddForm(false)} style={{ padding: '6px 16px', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleAdd} style={{ padding: '6px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Lessons list */}
      {filtered.map(l => (
        <div key={l.id} style={{ ...cardStyle, ...RISK_INDICATOR.style(CATEGORY_COLORS[l.category]) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: HBC_COLORS.navy }}>{l.title}</h4>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, backgroundColor: `${CATEGORY_COLORS[l.category]}20`, color: CATEGORY_COLORS[l.category] }}>{l.category}</span>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, backgroundColor: `${IMPACT_COLORS[l.impact]}20`, color: IMPACT_COLORS[l.impact] }}>{l.impact}</span>
            </div>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.5 }}>{l.description}</p>
          {l.recommendation && (
            <div style={{ backgroundColor: HBC_COLORS.gray50, borderRadius: 4, padding: '8px 12px', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: HBC_COLORS.gray500 }}>Recommendation: </span>
              <span style={{ fontSize: 12 }}>{l.recommendation}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: HBC_COLORS.gray400 }}>
              <span>Phase: {l.phase}</span>
              <span>By: {l.raisedBy.split('@')[0]}</span>
              <span>{l.raisedDate}</span>
            </div>
            {canEdit && (
              <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: l.isIncludedInFinalRecord ? HBC_COLORS.success : HBC_COLORS.gray400 }}>
                <input type="checkbox" checked={l.isIncludedInFinalRecord} onChange={() => handleToggleFinal(l.id, l.isIncludedInFinalRecord)} />
                Include in Final Record
              </label>
            )}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No lessons learned match the current filter.</div>}
    </div>
  );
};
