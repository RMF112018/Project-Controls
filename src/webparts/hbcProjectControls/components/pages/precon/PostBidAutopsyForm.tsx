import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { usePostBidAutopsy } from '../../hooks/usePostBidAutopsy';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import {
  buildBreadcrumbs,
  ILossAutopsy,
  AutopsyAnswer,
  AUTOPSY_QUESTIONS,
  ActionItemStatus,
  AuditAction,
  EntityType
} from '@hbc/sp-services';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';

/** Calculate process score from the 11 yes/no questions */
function calculateProcessScore(autopsy: Partial<ILossAutopsy>): number {
  let answered = 0;
  let yesCount = 0;
  for (const q of AUTOPSY_QUESTIONS) {
    const val = autopsy[q.key as keyof ILossAutopsy] as AutopsyAnswer;
    if (val !== null && val !== undefined) {
      answered++;
      if (val === true) yesCount++;
    }
  }
  if (answered === 0) return 0;
  return Math.round((yesCount / answered) * 100);
}

export const PostBidAutopsyForm: React.FC = () => {
  const { id: leadIdParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { dataService, currentUser } = useAppContext();
  const {
    autopsy,
    lead,
    isLoading,
    error,
    fetchAutopsy,
    saveAutopsy,
    finalizeAutopsy,
    pushToLessonsLearned,
  } = usePostBidAutopsy();

  const leadId = leadIdParam ? parseInt(leadIdParam, 10) : 0;

  // Local form state
  const [form, setForm] = React.useState<Partial<ILossAutopsy>>({});
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

  React.useEffect(() => {
    if (leadId > 0) fetchAutopsy(leadId).catch(console.error);
  }, [leadId, fetchAutopsy]);

  React.useEffect(() => {
    if (autopsy) {
      setForm({ ...autopsy });
    }
  }, [autopsy]);

  const processScore = React.useMemo(() => calculateProcessScore(form), [form]);
  const breadcrumbs = buildBreadcrumbs(location.pathname, lead?.Title);

  const updateField = <K extends keyof ILossAutopsy>(key: K, value: ILossAutopsy[K]): void => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleQuestionToggle = (key: keyof ILossAutopsy, value: AutopsyAnswer): void => {
    const current = form[key] as AutopsyAnswer;
    // Toggle: clicking same value sets to null (NA)
    updateField(key, current === value ? null : value as never);
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await saveAutopsy({
        ...form,
        leadId,
        processScore,
        projectCode: lead?.ProjectCode ?? form.projectCode,
      });
      showToast('Autopsy saved successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async (): Promise<void> => {
    // Validation
    const unanswered = AUTOPSY_QUESTIONS.filter(q => {
      const val = form[q.key as keyof ILossAutopsy] as AutopsyAnswer;
      return val === null || val === undefined;
    });
    if (unanswered.length > 0) {
      showToast(`Please answer all process questions. ${unanswered.length} remaining.`, 'error');
      return;
    }
    if (!form.overallRating || form.overallRating < 1 || form.overallRating > 10) {
      showToast('Please provide an Overall Project Rating (1-10).', 'error');
      return;
    }

    setSaving(true);
    try {
      const projectCode = lead?.ProjectCode ?? form.projectCode ?? `lead-${leadId}`;

      // Check if "pricesMatchHistorical" is No — create high priority action item
      const actionItems = [...(form.actionItems ?? [])];
      if (form.pricesMatchHistorical === false) {
        const existingHistorical = actionItems.find(a =>
          a.description.includes('Update historical pricing records')
        );
        if (!existingHistorical) {
          actionItems.push({
            id: Date.now(),
            projectCode,
            description: 'Update historical pricing records — triggered by Post-Bid Autopsy (prices did not match historical data)',
            assignee: 'estimating@hedrickbrothers.com',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: ActionItemStatus.Open,
          });
        }
      }

      const finalized = await finalizeAutopsy(leadId, {
        ...form,
        processScore,
        actionItems,
        finalizedBy: currentUser?.email ?? 'system',
      });

      // Push to Lessons Learned
      await pushToLessonsLearned(finalized, projectCode);

      // Audit log
      await dataService.logAudit({
        Action: AuditAction.AutopsyCompleted,
        EntityType: EntityType.Lead,
        EntityId: String(leadId),
        ProjectCode: projectCode,
        Details: `Post-Bid Autopsy finalized. Process Score: ${processScore}%. Overall Rating: ${form.overallRating}/10.`,
      });

      showToast('Autopsy finalized. Lessons Learned updated. Archive unlocked.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to finalize', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error'): void => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 5000);
  };

  if (isLoading) return <SkeletonLoader variant="form" rows={8} />;
  if (error) return <div style={{ padding: 48, color: '#EF4444' }}>{error}</div>;
  if (!leadId) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>No lead specified</h2></div>;

  const isReadOnly = form.isFinalized === true;

  return (
    <div>
      <PageHeader
        title="Post-Bid Autopsy"
        subtitle={lead ? `${lead.Title} — ${lead.ClientName}` : `Lead #${leadId}`}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
      />

      {toast && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: toastType === 'success' ? '#D1FAE5' : '#FDE8E8',
          color: toastType === 'success' ? '#065F46' : '#9B1C1C',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 14,
        }}>
          {toast}
        </div>
      )}

      {isReadOnly && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#DBEAFE',
          color: '#1E40AF',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 14,
          fontWeight: 600,
        }}>
          This autopsy has been finalized and is read-only. Archive is unlocked.
        </div>
      )}

      {/* Process Score Banner */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        ...RISK_INDICATOR.style(processScore >= 70 ? RISK_INDICATOR.colors.success : processScore >= 50 ? RISK_INDICATOR.colors.warning : RISK_INDICATOR.colors.critical),
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase' as const }}>
            Overall Process Score
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: processScore >= 70 ? '#10B981' : processScore >= 50 ? '#F59E0B' : '#EF4444' }}>
            {processScore}%
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase' as const }}>
            Overall Project Rating
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <input
              type="range"
              min={1}
              max={10}
              value={form.overallRating ?? 5}
              onChange={e => updateField('overallRating', parseInt(e.target.value, 10))}
              disabled={isReadOnly}
              style={{ width: 120 }}
            />
            <span style={{ fontSize: 24, fontWeight: 700, color: HBC_COLORS.navy, minWidth: 36, textAlign: 'center' }}>
              {form.overallRating ?? '-'}/10
            </span>
          </div>
        </div>
      </div>

      {/* Estimating Process Questions */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={sectionTitle}>Estimating Process Evaluation</h3>
        <p style={{ fontSize: 12, color: HBC_COLORS.gray500, margin: '0 0 16px' }}>
          Answer Yes or No for each question. Click again to clear (N/A).
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {AUTOPSY_QUESTIONS.map((q, idx) => {
            const val = form[q.key as keyof ILossAutopsy] as AutopsyAnswer;
            return (
              <div key={q.key} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 6,
                backgroundColor: idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                border: `1px solid ${HBC_COLORS.gray200}`,
              }}>
                <div style={{ flex: 1, fontSize: 14, color: HBC_COLORS.navy }}>
                  <span style={{ fontWeight: 600 }}>{idx + 1}.</span> {q.label}
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginTop: 2 }}>{q.tooltip}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
                  <button
                    onClick={() => handleQuestionToggle(q.key, true)}
                    disabled={isReadOnly}
                    style={{
                      ...toggleBtnStyle,
                      backgroundColor: val === true ? '#10B981' : '#F3F4F6',
                      color: val === true ? '#FFFFFF' : HBC_COLORS.gray600,
                      border: `1px solid ${val === true ? '#10B981' : HBC_COLORS.gray300}`,
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleQuestionToggle(q.key, false)}
                    disabled={isReadOnly}
                    style={{
                      ...toggleBtnStyle,
                      backgroundColor: val === false ? '#EF4444' : '#F3F4F6',
                      color: val === false ? '#FFFFFF' : HBC_COLORS.gray600,
                      border: `1px solid ${val === false ? '#EF4444' : HBC_COLORS.gray300}`,
                    }}
                  >
                    No
                  </button>
                  <span style={{
                    fontSize: 11,
                    color: HBC_COLORS.gray400,
                    width: 28,
                    textAlign: 'center',
                    lineHeight: '30px',
                  }}>
                    {val === null || val === undefined ? 'N/A' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SWOC Discussion */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={sectionTitle}>Discussion — Strengths, Weaknesses, Opportunities, Challenges</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Strengths</label>
            <textarea
              value={form.strengths ?? ''}
              onChange={e => updateField('strengths', e.target.value)}
              disabled={isReadOnly}
              placeholder="What went well in the estimating process..."
              style={{ ...textareaStyle, borderLeft: '3px solid #10B981' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Weaknesses</label>
            <textarea
              value={form.weaknesses ?? ''}
              onChange={e => updateField('weaknesses', e.target.value)}
              disabled={isReadOnly}
              placeholder="Areas for improvement..."
              style={{ ...textareaStyle, borderLeft: '3px solid #EF4444' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Opportunities</label>
            <textarea
              value={form.opportunities ?? ''}
              onChange={e => updateField('opportunities', e.target.value)}
              disabled={isReadOnly}
              placeholder="Future opportunities identified..."
              style={{ ...textareaStyle, borderLeft: '3px solid #3B82F6' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Challenges</label>
            <textarea
              value={form.challenges ?? ''}
              onChange={e => updateField('challenges', e.target.value)}
              disabled={isReadOnly}
              placeholder="External challenges or market factors..."
              style={{ ...textareaStyle, borderLeft: '3px solid #F59E0B' }}
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={sectionTitle}>Additional Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Root Cause Analysis</label>
            <textarea
              value={form.rootCauseAnalysis ?? ''}
              onChange={e => updateField('rootCauseAnalysis', e.target.value)}
              disabled={isReadOnly}
              placeholder="Primary root cause of the loss..."
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Competitive Intelligence</label>
            <textarea
              value={form.competitiveIntelligence ?? ''}
              onChange={e => updateField('competitiveIntelligence', e.target.value)}
              disabled={isReadOnly}
              placeholder="What was learned about competitors..."
              style={textareaStyle}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Meeting Notes</label>
          <textarea
            value={form.meetingNotes ?? ''}
            onChange={e => updateField('meetingNotes', e.target.value)}
            disabled={isReadOnly}
            placeholder="Notes from the autopsy meeting..."
            style={{ ...textareaStyle, minHeight: 80 }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              backgroundColor: HBC_COLORS.navy,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleFinalize}
            disabled={saving}
            style={{
              padding: '10px 24px',
              backgroundColor: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {saving ? 'Finalizing...' : 'Finalize Autopsy'}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 24px',
              backgroundColor: '#fff',
              color: HBC_COLORS.gray600,
              border: `1px solid ${HBC_COLORS.gray300}`,
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Back
          </button>
        </div>
      )}

      {isReadOnly && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/preconstruction/autopsy-list')}
            style={{
              padding: '10px 24px',
              backgroundColor: HBC_COLORS.navy,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Back to Autopsies
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 24,
  boxShadow: ELEVATION.level1,
};

const sectionTitle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 700,
  color: HBC_COLORS.navy,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: HBC_COLORS.gray600,
  marginBottom: 4,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`,
  boxSizing: 'border-box' as const,
  outline: 'none',
  minHeight: 100,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
};

const toggleBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  minWidth: 40,
  textAlign: 'center' as const,
};
