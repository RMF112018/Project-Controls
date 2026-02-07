import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Select, Textarea } from '@fluentui/react-components';
import { useGoNoGo } from '../../hooks/useGoNoGo';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ScoreTierBadge } from '../../shared/ScoreTierBadge';
import { ExportButtons } from '../../shared/ExportButtons';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import {
  IGoNoGoScorecard as IScorecardModel,
  SCORECARD_CRITERIA,
  IScorecardCriterion,
  ILead,
  GoNoGoDecision,
  RoleName,
  Stage,
} from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { PERMISSIONS } from '../../../utils/permissions';
import { ExportService } from '../../../services/ExportService';
import {
  calculateTotalScore,
  getScoreTier,
  getScoreTierLabel,
  getScoreTierColor,
  isScorecardComplete,
  getCompletionPercentage,
} from '../../../utils/scoreCalculator';

type ScoreLevel = 'high' | 'avg' | 'low';

const TIER_DESCRIPTORS: Record<number, Record<ScoreLevel, string>> = {
  1: { high: 'Existing/repeat client, strong relationship', avg: 'Known client, moderate relationship', low: 'New client, no relationship' },
  2: { high: 'Sole source / invited', avg: 'Short list (3-4 firms)', low: 'Open bid / 5+ firms' },
  3: { high: 'Above $50M', avg: '$10M-$50M', low: 'Below $10M' },
  4: { high: 'Core market, ideal location', avg: 'Acceptable location/conditions', low: 'Remote or challenging environment' },
  5: { high: 'Strong margins expected', avg: 'Acceptable margins', low: 'Thin or uncertain margins' },
  6: { high: 'HBC is preferred builder', avg: 'HBC is on short list', low: 'No established preference' },
  7: { high: 'Multiple successful projects with A/E', avg: 'Some prior experience', low: 'No prior relationship' },
  8: { high: 'Team fully available', avg: 'Partial availability, some reallocation', low: 'Key staff committed elsewhere' },
  9: { high: 'Extensive experience in type', avg: 'Some relevant experience', low: 'No experience in project type' },
  10: { high: 'Active in region', avg: 'Some presence in area', low: 'No geographic experience' },
  11: { high: 'Comfortable schedule', avg: 'Tight but achievable', low: 'Aggressive or unrealistic' },
  12: { high: 'Favorable, standard terms', avg: 'Acceptable with negotiation', low: 'Onerous or non-negotiable terms' },
  13: { high: 'GMP / Negotiated', avg: 'Precon with GMP amend', low: 'Hard-bid / lump sum' },
  14: { high: 'Fully funded, strong client', avg: 'Financing in progress', low: 'Uncertain funding source' },
  15: { high: 'New sector / strategic growth', avg: 'Moderate diversification', low: 'Existing core sector' },
  16: { high: 'Minimal investment required', avg: 'Moderate upfront investment', low: 'Significant time/cost to pursue' },
  17: { high: 'Above-average profit expected', avg: 'Average profit expected', low: 'Below-average profit' },
  18: { high: 'Strong fee enhancement opportunity', avg: 'Some fee opportunities', low: 'Standard fee only' },
  19: { high: 'Significant self-perform scope', avg: 'Some self-perform potential', low: 'Minimal self-perform' },
};

const PROJECT_CODE_REGEX = /^\d{2}-\d{3}-\d{2}$/;

export const GoNoGoScorecard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAppContext();
  const { getScorecardByLeadId, createScorecard, updateScorecard, submitDecision } = useGoNoGo();
  const { getLeadById, updateLead } = useLeads();

  const [lead, setLead] = React.useState<ILead | null>(null);
  const [scorecard, setScorecard] = React.useState<IScorecardModel | null>(null);
  const [scores, setScores] = React.useState<IScorecardModel['scores']>({});
  const [qualFields, setQualFields] = React.useState<Record<string, string | number>>({});
  const [decision, setDecision] = React.useState<GoNoGoDecision | ''>('');
  const [projectCode, setProjectCode] = React.useState('');
  const [projectCodeError, setProjectCodeError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showGoDialog, setShowGoDialog] = React.useState(false);
  const [showNoGoDialog, setShowNoGoDialog] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const leadId = Number(id);

  // Determine user roles for RBAC
  const canScoreOriginator = hasPermission(PERMISSIONS.GONOGO_SCORE_ORIGINATOR);
  const canScoreCommittee = hasPermission(PERMISSIONS.GONOGO_SCORE_COMMITTEE);
  const canDecide = hasPermission(PERMISSIONS.GONOGO_DECIDE);
  const isSubmitted = !!scorecard?.Decision;

  React.useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [leadData, existing] = await Promise.all([
          getLeadById(leadId),
          getScorecardByLeadId(leadId),
        ]);
        setLead(leadData);
        if (existing) {
          setScorecard(existing);
          setScores(existing.scores || {});
          setQualFields({
            OriginatorComments: existing.OriginatorComments || '',
            CommitteeComments: existing.CommitteeComments || '',
            ProposalMarketingComments: existing.ProposalMarketingComments || '',
            ProposalMarketingResources: existing.ProposalMarketingResources || '',
            ProposalMarketingHours: existing.ProposalMarketingHours || 0,
            EstimatingComments: existing.EstimatingComments || '',
            EstimatingResources: existing.EstimatingResources || '',
            EstimatingHours: existing.EstimatingHours || 0,
            DecisionMakingProcess: existing.DecisionMakingProcess || '',
            HBDifferentiators: existing.HBDifferentiators || '',
            WinStrategy: existing.WinStrategy || '',
            StrategicPursuit: existing.StrategicPursuit || '',
            DecisionMakerAdvocate: existing.DecisionMakerAdvocate || '',
          });
          if (existing.Decision) setDecision(existing.Decision);
          if (existing.ProjectCode) setProjectCode(existing.ProjectCode);
        }
      } catch (err) {
        console.error('Failed to load scorecard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load().catch(console.error);
  }, [leadId, getLeadById, getScorecardByLeadId]);

  const handleScore = (criterionId: number, column: 'originator' | 'committee', value: number): void => {
    if (isSubmitted) return;
    if (column === 'originator' && !canScoreOriginator) return;
    if (column === 'committee' && !canScoreCommittee) return;

    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [column]: value,
      },
    }));
  };

  const handleQualChange = (field: string, value: string | number): void => {
    if (isSubmitted) return;
    setQualFields(prev => ({ ...prev, [field]: value }));
  };

  const origTotal = calculateTotalScore(scores, 'originator');
  const cmteTotal = calculateTotalScore(scores, 'committee');
  const origComplete = isScorecardComplete(scores, 'originator');
  const cmteComplete = isScorecardComplete(scores, 'committee');
  const origPct = getCompletionPercentage(scores, 'originator');
  const cmtePct = getCompletionPercentage(scores, 'committee');

  const handleSave = async (): Promise<void> => {
    try {
      setIsSaving(true);
      const data: Partial<IScorecardModel> = {
        LeadID: leadId,
        scores,
        TotalScore_Orig: origTotal,
        TotalScore_Cmte: cmteTotal,
        ScoredBy_Orig: canScoreOriginator ? currentUser?.email : scorecard?.ScoredBy_Orig,
        ...qualFields,
      };
      if (scorecard) {
        const updated = await updateScorecard(scorecard.id, data);
        setScorecard(updated);
      } else {
        const created = await createScorecard(data);
        setScorecard(created);
      }
      setToastMessage('Scorecard saved successfully');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save scorecard:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecision = async (dec: GoNoGoDecision): Promise<void> => {
    if (dec === GoNoGoDecision.Go) {
      if (!PROJECT_CODE_REGEX.test(projectCode)) {
        setProjectCodeError('Format must be yy-nnn-0m (e.g. 26-042-01)');
        return;
      }
      setProjectCodeError('');
    }

    try {
      setIsSaving(true);
      // Save scorecard first with latest data
      await handleSave();

      if (!scorecard) return;
      await submitDecision(scorecard.id, dec, dec === GoNoGoDecision.Go ? projectCode : undefined);

      // Update lead stage
      if (dec === GoNoGoDecision.Go) {
        await updateLead(leadId, {
          Stage: Stage.Opportunity,
          GoNoGoDecision: GoNoGoDecision.Go,
          GoNoGoDecisionDate: new Date().toISOString(),
          GoNoGoScore_Originator: origTotal,
          GoNoGoScore_Committee: cmteTotal,
          ProjectCode: projectCode,
        });
        console.log(`[Mock] Site provisioning triggered for project ${projectCode}`);
        setToastMessage(`GO decision recorded. Project code ${projectCode} assigned. Site provisioning triggered.`);
      } else if (dec === GoNoGoDecision.NoGo) {
        await updateLead(leadId, {
          Stage: Stage.ArchivedNoGo,
          GoNoGoDecision: GoNoGoDecision.NoGo,
          GoNoGoDecisionDate: new Date().toISOString(),
          GoNoGoScore_Originator: origTotal,
          GoNoGoScore_Committee: cmteTotal,
        });
        setToastMessage('NO GO decision recorded. Lead archived.');
      } else {
        await updateLead(leadId, {
          Stage: Stage.GoNoGoWait,
          GoNoGoDecision: GoNoGoDecision.Wait,
          GoNoGoDecisionDate: new Date().toISOString(),
          GoNoGoScore_Originator: origTotal,
          GoNoGoScore_Committee: cmteTotal,
        });
        console.log('[Mock] Reminder notification scheduled for WAIT decision');
        setToastMessage('WAIT decision recorded. Reminder notification scheduled.');
      }

      setDecision(dec);
      setShowGoDialog(false);
      setShowNoGoDialog(false);
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error('Failed to submit decision:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = React.useMemo(() => {
    return SCORECARD_CRITERIA.map(c => ({
      '#': c.id,
      Criterion: c.label,
      'High Pts': c.high,
      'Avg Pts': c.avg,
      'Low Pts': c.low,
      'Originator Score': scores[c.id]?.originator ?? '',
      'Committee Score': scores[c.id]?.committee ?? '',
    }));
  }, [scores]);

  if (isLoading) return <LoadingSpinner label="Loading scorecard..." />;
  if (!lead) return <div style={{ padding: '24px', color: HBC_COLORS.error }}>Lead not found</div>;

  const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: HBC_COLORS.gray700, marginBottom: '4px', display: 'block' };
  const fieldStyle: React.CSSProperties = { marginBottom: '16px' };

  return (
    <div id="scorecard-view">
      <PageHeader
        title={`Go/No-Go Scorecard`}
        subtitle={`${lead.Title} — ${lead.ClientName}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ExportButtons
              data={exportData}
              pdfElementId="scorecard-view"
              filename={`GNG-${lead.Title.replace(/\s+/g, '_')}`}
              title={`Go/No-Go Scorecard: ${lead.Title}`}
            />
            <Button appearance="secondary" onClick={() => navigate(`/lead/${leadId}`)}>Back to Lead</Button>
          </div>
        }
      />

      {/* Toast */}
      {toastMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: HBC_COLORS.successLight,
          color: '#065F46',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          {toastMessage}
        </div>
      )}

      {/* Score Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginBottom: '4px' }}>Originator Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ScoreTierBadge score={origTotal} showLabel />
            <span style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>{origPct}% complete</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginBottom: '4px' }}>Committee Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ScoreTierBadge score={cmteTotal} showLabel />
            <span style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>{cmtePct}% complete</span>
          </div>
        </div>
      </div>

      {/* Scoring Grid */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'auto',
        marginBottom: '24px',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: HBC_COLORS.navy }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: '12px', fontWeight: 600, width: '30px' }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: '12px', fontWeight: 600, width: '260px' }}>Criterion</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>High</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Avg</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Low</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: HBC_COLORS.orange, fontSize: '12px', fontWeight: 600, borderLeft: `2px solid ${HBC_COLORS.lightNavy}` }}>Originator</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: HBC_COLORS.orange, fontSize: '12px', fontWeight: 600 }}>Committee</th>
            </tr>
          </thead>
          <tbody>
            {SCORECARD_CRITERIA.map((criterion, idx) => (
              <CriterionRow
                key={criterion.id}
                criterion={criterion}
                scores={scores[criterion.id]}
                onScore={handleScore}
                canScoreOriginator={canScoreOriginator && !isSubmitted}
                canScoreCommittee={canScoreCommittee && !isSubmitted}
                isEven={idx % 2 === 0}
              />
            ))}
            <tr style={{ backgroundColor: HBC_COLORS.navy }}>
              <td colSpan={5} style={{ padding: '10px 12px', color: '#fff', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>
                TOTAL (Max 92)
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center', borderLeft: `2px solid ${HBC_COLORS.lightNavy}` }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: getScoreTierColor(origTotal),
                }}>
                  {origTotal}
                </span>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: getScoreTierColor(cmteTotal),
                }}>
                  {cmteTotal}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Score Tier Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', fontSize: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#10B981', display: 'inline-block' }} />
          69+: Focus All Efforts
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#F59E0B', display: 'inline-block' }} />
          55–68: Pursue / Prioritize
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#EF4444', display: 'inline-block' }} />
          Below 55: Drop
        </span>
      </div>

      {/* Qualitative Fields */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
          Qualitative Assessment
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Originator Comments</label>
            <Textarea
              style={{ width: '100%' }}
              rows={3}
              value={String(qualFields.OriginatorComments || '')}
              onChange={(_, d) => handleQualChange('OriginatorComments', d.value)}
              disabled={isSubmitted || !canScoreOriginator}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Committee Comments</label>
            <Textarea
              style={{ width: '100%' }}
              rows={3}
              value={String(qualFields.CommitteeComments || '')}
              onChange={(_, d) => handleQualChange('CommitteeComments', d.value)}
              disabled={isSubmitted || !canScoreCommittee}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Proposal Marketing Comments</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.ProposalMarketingComments || '')}
              onChange={(_, d) => handleQualChange('ProposalMarketingComments', d.value)}
              disabled={isSubmitted}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Marketing Resources</label>
              <Input
                style={{ width: '100%' }}
                value={String(qualFields.ProposalMarketingResources || '')}
                onChange={(_, d) => handleQualChange('ProposalMarketingResources', d.value)}
                disabled={isSubmitted}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Marketing Hours</label>
              <Input
                type="number"
                style={{ width: '100%' }}
                value={String(qualFields.ProposalMarketingHours || '')}
                onChange={(_, d) => handleQualChange('ProposalMarketingHours', Number(d.value))}
                disabled={isSubmitted}
              />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Estimating Comments</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.EstimatingComments || '')}
              onChange={(_, d) => handleQualChange('EstimatingComments', d.value)}
              disabled={isSubmitted}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Estimating Resources</label>
              <Input
                style={{ width: '100%' }}
                value={String(qualFields.EstimatingResources || '')}
                onChange={(_, d) => handleQualChange('EstimatingResources', d.value)}
                disabled={isSubmitted}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Estimating Hours</label>
              <Input
                type="number"
                style={{ width: '100%' }}
                value={String(qualFields.EstimatingHours || '')}
                onChange={(_, d) => handleQualChange('EstimatingHours', Number(d.value))}
                disabled={isSubmitted}
              />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Decision-Making Process</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.DecisionMakingProcess || '')}
              onChange={(_, d) => handleQualChange('DecisionMakingProcess', d.value)}
              disabled={isSubmitted}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>HB Differentiators</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.HBDifferentiators || '')}
              onChange={(_, d) => handleQualChange('HBDifferentiators', d.value)}
              disabled={isSubmitted}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Win Strategy</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.WinStrategy || '')}
              onChange={(_, d) => handleQualChange('WinStrategy', d.value)}
              disabled={isSubmitted}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Strategic Pursuit</label>
            <Input
              style={{ width: '100%' }}
              value={String(qualFields.StrategicPursuit || '')}
              onChange={(_, d) => handleQualChange('StrategicPursuit', d.value)}
              disabled={isSubmitted}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Decision Maker Advocate</label>
            <Input
              style={{ width: '100%' }}
              value={String(qualFields.DecisionMakerAdvocate || '')}
              onChange={(_, d) => handleQualChange('DecisionMakerAdvocate', d.value)}
              disabled={isSubmitted}
            />
          </div>
        </div>
      </div>

      {/* Decision Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
          Decision
        </h3>
        {isSubmitted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 24px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '16px',
              color: '#fff',
              backgroundColor: decision === GoNoGoDecision.Go ? HBC_COLORS.success
                : decision === GoNoGoDecision.NoGo ? HBC_COLORS.error
                : HBC_COLORS.warning,
            }}>
              {decision}
            </span>
            {scorecard?.DecisionDate && (
              <span style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                Decided on {new Date(scorecard.DecisionDate).toLocaleDateString()}
              </span>
            )}
            {scorecard?.ProjectCode && (
              <span style={{ fontSize: '13px', color: HBC_COLORS.navy, fontWeight: 600 }}>
                Project Code: {scorecard.ProjectCode}
              </span>
            )}
          </div>
        ) : canDecide ? (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <Button
                appearance="primary"
                style={{ backgroundColor: HBC_COLORS.success }}
                disabled={isSaving}
                onClick={() => setShowGoDialog(true)}
              >
                GO
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: HBC_COLORS.error }}
                disabled={isSaving}
                onClick={() => setShowNoGoDialog(true)}
              >
                NO GO
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: HBC_COLORS.warning }}
                disabled={isSaving}
                onClick={() => handleDecision(GoNoGoDecision.Wait)}
              >
                WAIT
              </Button>
            </div>
            {showGoDialog && (
              <div style={{
                padding: '16px',
                backgroundColor: HBC_COLORS.successLight,
                borderRadius: '6px',
                marginBottom: '12px',
              }}>
                <label style={labelStyle}>Project Code (format: yy-nnn-0m) *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div>
                    <Input
                      value={projectCode}
                      onChange={(_, d) => { setProjectCode(d.value); setProjectCodeError(''); }}
                      placeholder="26-042-01"
                      style={{ width: '160px' }}
                    />
                    {projectCodeError && (
                      <div style={{ color: HBC_COLORS.error, fontSize: '12px', marginTop: '4px' }}>{projectCodeError}</div>
                    )}
                  </div>
                  <Button appearance="primary" onClick={() => handleDecision(GoNoGoDecision.Go)} disabled={isSaving}>
                    Confirm GO
                  </Button>
                  <Button appearance="secondary" onClick={() => setShowGoDialog(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
            Decision can only be made by Executive Leadership.
          </div>
        )}
      </div>

      {/* Save Button */}
      {!isSubmitted && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button appearance="secondary" onClick={() => navigate(`/lead/${leadId}`)}>Cancel</Button>
          <Button appearance="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Scorecard'}
          </Button>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showNoGoDialog}
        title="Confirm NO GO"
        message={`This will archive "${lead.Title}" as No-Go. This action cannot be undone.`}
        confirmLabel="Confirm NO GO"
        onConfirm={() => handleDecision(GoNoGoDecision.NoGo)}
        onCancel={() => setShowNoGoDialog(false)}
        danger
      />
    </div>
  );
};

// --- Criterion Row Sub-component ---

interface ICriterionRowProps {
  criterion: IScorecardCriterion;
  scores?: { originator?: number; committee?: number };
  onScore: (criterionId: number, column: 'originator' | 'committee', value: number) => void;
  canScoreOriginator: boolean;
  canScoreCommittee: boolean;
  isEven: boolean;
}

const CriterionRow: React.FC<ICriterionRowProps> = ({
  criterion, scores, onScore, canScoreOriginator, canScoreCommittee, isEven,
}) => {
  const descriptors = TIER_DESCRIPTORS[criterion.id];
  const cellBase: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '12px',
    borderBottom: `1px solid ${HBC_COLORS.gray100}`,
    backgroundColor: isEven ? '#fff' : HBC_COLORS.gray50,
  };

  const renderScoreBtn = (
    column: 'originator' | 'committee',
    level: ScoreLevel,
    value: number,
    canEdit: boolean,
  ): React.ReactElement => {
    const isSelected = scores?.[column] === value;
    return (
      <button
        onClick={() => canEdit && onScore(criterion.id, column, value)}
        disabled={!canEdit}
        style={{
          width: '36px',
          height: '28px',
          border: isSelected ? `2px solid ${HBC_COLORS.navy}` : `1px solid ${HBC_COLORS.gray200}`,
          borderRadius: '4px',
          backgroundColor: isSelected ? HBC_COLORS.navy : '#fff',
          color: isSelected ? '#fff' : HBC_COLORS.gray700,
          fontWeight: isSelected ? 700 : 400,
          fontSize: '12px',
          cursor: canEdit ? 'pointer' : 'not-allowed',
          opacity: canEdit ? 1 : 0.5,
        }}
      >
        {value}
      </button>
    );
  };

  return (
    <tr>
      <td style={{ ...cellBase, textAlign: 'center', fontWeight: 600, color: HBC_COLORS.gray400 }}>{criterion.id}</td>
      <td style={{ ...cellBase }}>
        <div style={{ fontWeight: 500, color: HBC_COLORS.gray800, marginBottom: '2px' }}>{criterion.label}</div>
        {descriptors && (
          <div style={{ fontSize: '10px', color: HBC_COLORS.gray400, lineHeight: '1.3' }}>
            H: {descriptors.high} | A: {descriptors.avg} | L: {descriptors.low}
          </div>
        )}
      </td>
      <td style={{ ...cellBase, textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.success }}>{criterion.high}</span>
      </td>
      <td style={{ ...cellBase, textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.warning }}>{criterion.avg}</span>
      </td>
      <td style={{ ...cellBase, textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.error }}>{criterion.low}</span>
      </td>
      <td style={{ ...cellBase, textAlign: 'center', borderLeft: `2px solid ${HBC_COLORS.gray200}` }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          {renderScoreBtn('originator', 'high', criterion.high, canScoreOriginator)}
          {renderScoreBtn('originator', 'avg', criterion.avg, canScoreOriginator)}
          {renderScoreBtn('originator', 'low', criterion.low, canScoreOriginator)}
        </div>
      </td>
      <td style={{ ...cellBase, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          {renderScoreBtn('committee', 'high', criterion.high, canScoreCommittee)}
          {renderScoreBtn('committee', 'avg', criterion.avg, canScoreCommittee)}
          {renderScoreBtn('committee', 'low', criterion.low, canScoreCommittee)}
        </div>
      </td>
    </tr>
  );
};
