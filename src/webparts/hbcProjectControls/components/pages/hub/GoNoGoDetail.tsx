import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import { useGoNoGo } from '../../hooks/useGoNoGo';
import { useLeads } from '../../hooks/useLeads';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ScoreTierBadge } from '../../shared/ScoreTierBadge';
import { ExportButtons } from '../../shared/ExportButtons';
import {
  IGoNoGoScorecard,
  SCORECARD_CRITERIA,
  ILead,
  GoNoGoDecision,
} from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import {
  calculateTotalScore,
  getScoreTierColor,
  getScoreTierLabel,
} from '../../../utils/scoreCalculator';

export const GoNoGoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getScorecardByLeadId } = useGoNoGo();
  const { getLeadById } = useLeads();

  const [lead, setLead] = React.useState<ILead | null>(null);
  const [scorecard, setScorecard] = React.useState<IGoNoGoScorecard | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const leadId = Number(id);

  React.useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [leadData, sc] = await Promise.all([
          getLeadById(leadId),
          getScorecardByLeadId(leadId),
        ]);
        setLead(leadData);
        setScorecard(sc);
      } catch (err) {
        console.error('Failed to load scorecard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load().catch(console.error);
  }, [leadId, getLeadById, getScorecardByLeadId]);

  if (isLoading) return <LoadingSpinner label="Loading scorecard..." />;
  if (!lead || !scorecard) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3 style={{ color: HBC_COLORS.gray700 }}>No scorecard found for this lead</h3>
        <Button appearance="secondary" onClick={() => navigate(`/lead/${leadId}`)}>Back to Lead</Button>
      </div>
    );
  }

  const origTotal = calculateTotalScore(scorecard.scores, 'originator');
  const cmteTotal = calculateTotalScore(scorecard.scores, 'committee');
  const diff = origTotal - cmteTotal;

  const exportData = SCORECARD_CRITERIA.map(c => ({
    '#': c.id,
    Criterion: c.label,
    'High Pts': c.high,
    'Avg Pts': c.avg,
    'Low Pts': c.low,
    'Originator Score': scorecard.scores[c.id]?.originator ?? '',
    'Committee Score': scorecard.scores[c.id]?.committee ?? '',
  }));

  const cellBase: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '12px',
    borderBottom: `1px solid ${HBC_COLORS.gray100}`,
  };

  return (
    <div id="scorecard-detail-view">
      <PageHeader
        title="Scorecard Detail"
        subtitle={`${lead.Title} — ${lead.ClientName}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ExportButtons
              data={exportData}
              pdfElementId="scorecard-detail-view"
              filename={`GNG-Detail-${lead.Title.replace(/\s+/g, '_')}`}
              title={`Go/No-Go Detail: ${lead.Title}`}
            />
            <Button appearance="secondary" onClick={() => navigate(`/lead/${leadId}`)}>Back to Lead</Button>
          </div>
        }
      />

      {/* Decision Banner */}
      {scorecard.Decision && (
        <div style={{
          padding: '16px 24px',
          marginBottom: '24px',
          borderRadius: '8px',
          backgroundColor: scorecard.Decision === GoNoGoDecision.Go ? HBC_COLORS.successLight
            : scorecard.Decision === GoNoGoDecision.NoGo ? HBC_COLORS.errorLight
            : HBC_COLORS.warningLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              padding: '6px 20px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '16px',
              color: '#fff',
              backgroundColor: scorecard.Decision === GoNoGoDecision.Go ? HBC_COLORS.success
                : scorecard.Decision === GoNoGoDecision.NoGo ? HBC_COLORS.error
                : HBC_COLORS.warning,
            }}>
              {scorecard.Decision}
            </span>
            {scorecard.DecisionDate && (
              <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>
                {new Date(scorecard.DecisionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          {scorecard.ProjectCode && (
            <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
              Project Code: {scorecard.ProjectCode}
            </span>
          )}
        </div>
      )}

      {/* Score Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginBottom: '8px' }}>Originator Score</div>
          <ScoreTierBadge score={origTotal} showLabel />
          {scorecard.ScoredBy_Orig && (
            <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '6px' }}>{scorecard.ScoredBy_Orig}</div>
          )}
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginBottom: '8px' }}>Committee Score</div>
          <ScoreTierBadge score={cmteTotal} showLabel />
          {scorecard.ScoredBy_Cmte && (
            <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '6px' }}>
              {scorecard.ScoredBy_Cmte.join(', ')}
            </div>
          )}
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginBottom: '8px' }}>Difference</div>
          <span style={{
            fontSize: '24px',
            fontWeight: 700,
            color: Math.abs(diff) <= 5 ? HBC_COLORS.gray700 : diff > 0 ? HBC_COLORS.success : HBC_COLORS.error,
          }}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
          <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '4px' }}>
            {diff > 0 ? 'Originator scored higher' : diff < 0 ? 'Committee scored higher' : 'Scores match'}
          </div>
        </div>
      </div>

      {/* Scoring Grid (Read-only) */}
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
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Criterion</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>High</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Avg</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>Low</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: HBC_COLORS.orange, fontSize: '12px', fontWeight: 600, borderLeft: `2px solid ${HBC_COLORS.lightNavy}` }}>Originator</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: HBC_COLORS.orange, fontSize: '12px', fontWeight: 600 }}>Committee</th>
            </tr>
          </thead>
          <tbody>
            {SCORECARD_CRITERIA.map((criterion, idx) => {
              const cs = scorecard.scores[criterion.id];
              const isEven = idx % 2 === 0;
              const bg = isEven ? '#fff' : HBC_COLORS.gray50;
              return (
                <tr key={criterion.id}>
                  <td style={{ ...cellBase, backgroundColor: bg, textAlign: 'center', color: HBC_COLORS.gray400, fontWeight: 600 }}>{criterion.id}</td>
                  <td style={{ ...cellBase, backgroundColor: bg, fontWeight: 500, color: HBC_COLORS.gray800 }}>{criterion.label}</td>
                  <td style={{ ...cellBase, backgroundColor: bg, textAlign: 'center', color: HBC_COLORS.success, fontWeight: 600 }}>{criterion.high}</td>
                  <td style={{ ...cellBase, backgroundColor: bg, textAlign: 'center', color: HBC_COLORS.warning, fontWeight: 600 }}>{criterion.avg}</td>
                  <td style={{ ...cellBase, backgroundColor: bg, textAlign: 'center', color: HBC_COLORS.error, fontWeight: 600 }}>{criterion.low}</td>
                  <td style={{ ...cellBase, backgroundColor: bg, textAlign: 'center', fontWeight: 600, borderLeft: `2px solid ${HBC_COLORS.gray200}` }}>
                    {cs?.originator !== undefined ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        backgroundColor: HBC_COLORS.navy,
                        color: '#fff',
                        fontSize: '12px',
                      }}>
                        {cs.originator}
                      </span>
                    ) : <span style={{ color: HBC_COLORS.gray300 }}>-</span>}
                  </td>
                  <td style={{ ...cellBase, backgroundColor: bg, textAlign: 'center', fontWeight: 600 }}>
                    {cs?.committee !== undefined ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        backgroundColor: HBC_COLORS.lightNavy,
                        color: '#fff',
                        fontSize: '12px',
                      }}>
                        {cs.committee}
                      </span>
                    ) : <span style={{ color: HBC_COLORS.gray300 }}>-</span>}
                  </td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: HBC_COLORS.navy }}>
              <td colSpan={5} style={{ padding: '10px 12px', color: '#fff', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>
                TOTAL
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

      {/* Qualitative Fields (read-only) */}
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
          <QualField label="Originator Comments" value={scorecard.OriginatorComments} />
          <QualField label="Committee Comments" value={scorecard.CommitteeComments} />
          <QualField label="Proposal Marketing Comments" value={scorecard.ProposalMarketingComments} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <QualField label="Marketing Resources" value={scorecard.ProposalMarketingResources} />
            <QualField label="Marketing Hours" value={scorecard.ProposalMarketingHours != null ? String(scorecard.ProposalMarketingHours) : undefined} />
          </div>
          <QualField label="Estimating Comments" value={scorecard.EstimatingComments} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <QualField label="Estimating Resources" value={scorecard.EstimatingResources} />
            <QualField label="Estimating Hours" value={scorecard.EstimatingHours != null ? String(scorecard.EstimatingHours) : undefined} />
          </div>
          <QualField label="Decision-Making Process" value={scorecard.DecisionMakingProcess} />
          <QualField label="HB Differentiators" value={scorecard.HBDifferentiators} />
          <QualField label="Win Strategy" value={scorecard.WinStrategy} />
          <QualField label="Strategic Pursuit" value={scorecard.StrategicPursuit} />
          <QualField label="Decision Maker Advocate" value={scorecard.DecisionMakerAdvocate} />
        </div>
      </div>
    </div>
  );
};

const QualField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ fontSize: '12px', fontWeight: 500, color: HBC_COLORS.gray500, marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '13px', color: value ? HBC_COLORS.gray800 : HBC_COLORS.gray300, whiteSpace: 'pre-wrap' }}>
      {value || 'Not provided'}
    </div>
  </div>
);
