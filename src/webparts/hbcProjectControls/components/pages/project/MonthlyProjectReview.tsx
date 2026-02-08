import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useMonthlyReview } from '../../hooks/useMonthlyReview';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { HBC_COLORS } from '../../../theme/tokens';
import { PERMISSIONS } from '../../../utils/permissions';
import { AuditAction, EntityType } from '../../../models/enums';
import { MonthlyReviewStatus, MONTHLY_CHECKLIST_SECTIONS, IMonthlyChecklistItem } from '../../../models/IMonthlyProjectReview';

const STATUS_STEPS: MonthlyReviewStatus[] = ['NotStarted', 'InProgress', 'PendingPXReview', 'PXReviewComplete', 'PMRevising', 'PendingPXValidation', 'SubmittedToLeadership', 'FollowUpPending', 'Complete'];
const STATUS_LABELS: Record<string, string> = {
  NotStarted: 'Not Started', InProgress: 'In Progress', PendingPXReview: 'PX Review', PXReviewComplete: 'PX Complete',
  PMRevising: 'PM Revising', PendingPXValidation: 'PX Validation', SubmittedToLeadership: 'Leadership', FollowUpPending: 'Follow-Up', Complete: 'Complete',
};

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 12 };

export const MonthlyProjectReview: React.FC = () => {
  const { selectedProject, hasPermission, dataService, currentUser } = useAppContext();
  const { reviews, currentReview, isLoading, error, fetchReviews, createReview, updateReview, advanceStatus, addFollowUp, selectReview } = useMonthlyReview();
  const projectCode = selectedProject?.projectCode ?? '';
  const isPM = hasPermission(PERMISSIONS.MONTHLY_REVIEW_PM);
  const isPX = hasPermission(PERMISSIONS.MONTHLY_REVIEW_PX);
  const canCreate = hasPermission(PERMISSIONS.MONTHLY_REVIEW_CREATE);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());
  const [newFollowUpQuestion, setNewFollowUpQuestion] = React.useState('');

  React.useEffect(() => { if (projectCode) fetchReviews(projectCode).catch(console.error); }, [projectCode, fetchReviews]);

  const toggleSection = (key: string): void => {
    setExpandedSections(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const handleCreateReview = React.useCallback(async () => {
    const now = new Date();
    const reviewMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10).toISOString().split('T')[0];
    const checklistItems: IMonthlyChecklistItem[] = [];
    let itemId = 1;
    MONTHLY_CHECKLIST_SECTIONS.forEach(sec => {
      sec.items.forEach(item => {
        checklistItems.push({ id: itemId++, sectionKey: sec.key, sectionTitle: sec.title, itemKey: item.key, itemDescription: item.description, pmComment: '', pxComment: '', pxInitial: '' });
      });
    });
    await createReview({ projectCode, reviewMonth, dueDate, checklistItems });
    dataService.logAudit({ Action: AuditAction.MonthlyReviewSubmitted, EntityType: EntityType.MonthlyReview, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Created review for ${reviewMonth}`, ProjectCode: projectCode }).catch(console.error);
  }, [projectCode, createReview, dataService, currentUser]);

  const handleChecklistBlur = React.useCallback(async (itemId: number, field: 'pmComment' | 'pxComment' | 'pxInitial', value: string) => {
    if (!currentReview) return;
    const updatedItems = currentReview.checklistItems.map(item => item.id === itemId ? { ...item, [field]: value } : item);
    await updateReview(currentReview.id, { checklistItems: updatedItems });
  }, [currentReview, updateReview]);

  const handleAdvance = React.useCallback(async (newStatus: MonthlyReviewStatus) => {
    if (!currentReview) return;
    await advanceStatus(currentReview.id, newStatus);
    dataService.logAudit({ Action: AuditAction.MonthlyReviewAdvanced, EntityType: EntityType.MonthlyReview, EntityId: String(currentReview.id), User: currentUser?.email ?? '', Details: `Status → ${newStatus}`, ProjectCode: projectCode }).catch(console.error);
  }, [currentReview, advanceStatus, dataService, currentUser, projectCode]);

  const handleAddFollowUp = React.useCallback(async () => {
    if (!currentReview || !newFollowUpQuestion.trim()) return;
    await addFollowUp(currentReview.id, { question: newFollowUpQuestion, requestedBy: currentUser?.email ?? '' });
    setNewFollowUpQuestion('');
  }, [currentReview, newFollowUpQuestion, addFollowUp, currentUser]);

  if (isLoading) return <LoadingSpinner label="Loading monthly reviews..." />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;

  const getNextStatus = (): { label: string; status: MonthlyReviewStatus } | null => {
    if (!currentReview) return null;
    const s = currentReview.status;
    if (isPM && s === 'InProgress') return { label: 'Submit to PX', status: 'PendingPXReview' };
    if (isPX && s === 'PendingPXReview') return { label: 'Complete PX Review', status: 'PXReviewComplete' };
    if (isPM && s === 'PXReviewComplete') return { label: 'Mark as Revised', status: 'PendingPXValidation' };
    if (isPM && s === 'PMRevising') return { label: 'Resubmit', status: 'PendingPXValidation' };
    if (isPX && s === 'PendingPXValidation') return { label: 'Submit to Leadership', status: 'SubmittedToLeadership' };
    if (isPX && s === 'SubmittedToLeadership') return { label: 'Complete Review', status: 'Complete' };
    if (isPX && s === 'FollowUpPending') return { label: 'Complete Review', status: 'Complete' };
    return null;
  };

  const nextAction = getNextStatus();

  return (
    <div>
      <PageHeader title="Monthly Project Review" subtitle={projectCode} />
      {/* Review selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={currentReview?.id ?? ''} onChange={e => selectReview(parseInt(e.target.value))} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '8px 12px', fontSize: 13 }}>
          {reviews.map(r => <option key={r.id} value={r.id}>{r.reviewMonth} — {STATUS_LABELS[r.status]}</option>)}
          {reviews.length === 0 && <option value="">No reviews</option>}
        </select>
        {(canCreate || isPX) && <button onClick={handleCreateReview} style={{ padding: '8px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ New Review</button>}
      </div>

      {currentReview && (
        <>
          {/* Status stepper */}
          <div style={{ ...cardStyle, padding: 16 }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {STATUS_STEPS.map((step, i) => {
                const stepIndex = STATUS_STEPS.indexOf(currentReview.status);
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                return (
                  <React.Fragment key={step}>
                    {i > 0 && <div style={{ flex: 1, height: 2, backgroundColor: isDone ? HBC_COLORS.success : HBC_COLORS.gray200 }} />}
                    <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: isDone ? HBC_COLORS.success : isActive ? HBC_COLORS.orange : HBC_COLORS.gray200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isDone || isActive ? '#fff' : HBC_COLORS.gray400, fontWeight: 600, flexShrink: 0 }} title={STATUS_LABELS[step]}>
                      {isDone ? '✓' : i + 1}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Due: {currentReview.dueDate}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.navy }}>{STATUS_LABELS[currentReview.status]}</span>
            </div>
            {nextAction && (
              <button onClick={() => handleAdvance(nextAction.status)} style={{ marginTop: 12, padding: '8px 20px', backgroundColor: HBC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{nextAction.label}</button>
            )}
          </div>

          {/* Checklist sections */}
          {MONTHLY_CHECKLIST_SECTIONS.map(sec => {
            const sectionItems = currentReview.checklistItems.filter(i => i.sectionKey === sec.key);
            const isExpanded = expandedSections.has(sec.key);
            return (
              <div key={sec.key} style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
                <div onClick={() => toggleSection(sec.key)} style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isExpanded ? HBC_COLORS.gray50 : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: HBC_COLORS.gray400 }}>{isExpanded ? '▼' : '▶'}</span>
                    <span style={{ fontWeight: 600, color: HBC_COLORS.navy, fontSize: 14 }}>{sec.title}</span>
                    <span style={{ fontSize: 11, color: HBC_COLORS.gray400 }}>({sectionItems.length} items)</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 20px 16px' }}>
                    {sectionItems.map(item => (
                      <div key={item.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}`, padding: '12px 0' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{item.itemDescription}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 10, color: HBC_COLORS.gray400 }}>PM Comment</label>
                            <textarea defaultValue={item.pmComment} onBlur={e => handleChecklistBlur(item.id, 'pmComment', e.target.value)} disabled={!isPM} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 6, fontSize: 12, minHeight: 40, resize: 'vertical' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: HBC_COLORS.gray400 }}>PX Comment</label>
                            <textarea defaultValue={item.pxComment} onBlur={e => handleChecklistBlur(item.id, 'pxComment', e.target.value)} disabled={!isPX} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 6, fontSize: 12, minHeight: 40, resize: 'vertical' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: HBC_COLORS.gray400 }}>PX Init.</label>
                            <input defaultValue={item.pxInitial} onBlur={e => handleChecklistBlur(item.id, 'pxInitial', e.target.value)} disabled={!isPX} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 6, fontSize: 12, textAlign: 'center' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Follow-ups */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy, fontSize: 16 }}>Follow-Up Items</h3>
            {currentReview.followUps.map(fu => (
              <div key={fu.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}`, padding: '10px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{fu.question}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: HBC_COLORS.gray400, marginTop: 4 }}>
                  <span>By: {fu.requestedBy.split('@')[0]}</span>
                  <span>{fu.requestedDate}</span>
                  <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 600, backgroundColor: fu.status === 'Closed' ? `${HBC_COLORS.success}20` : `${HBC_COLORS.warning}20`, color: fu.status === 'Closed' ? HBC_COLORS.success : HBC_COLORS.warning }}>{fu.status}</span>
                </div>
                {fu.pmResponse && <div style={{ fontSize: 12, marginTop: 4, backgroundColor: HBC_COLORS.gray50, padding: '6px 8px', borderRadius: 4 }}>Response: {fu.pmResponse}</div>}
              </div>
            ))}
            {isPX && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={newFollowUpQuestion} onChange={e => setNewFollowUpQuestion(e.target.value)} placeholder="Add follow-up question..." style={{ flex: 1, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '8px', fontSize: 13 }} />
                <button onClick={handleAddFollowUp} style={{ padding: '8px 16px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Add</button>
              </div>
            )}
          </div>

          {/* Report documents */}
          {currentReview.reportDocumentUrls.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 8px', color: HBC_COLORS.navy, fontSize: 14 }}>Report Documents</h3>
              {currentReview.reportDocumentUrls.map((url, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>{url.split('/').pop()}</a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {!currentReview && reviews.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No monthly reviews yet. Create one to get started.</div>}
    </div>
  );
};
