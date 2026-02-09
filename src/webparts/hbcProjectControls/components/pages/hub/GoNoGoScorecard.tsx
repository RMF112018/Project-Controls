import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Select, Textarea } from '@fluentui/react-components';
import { useGoNoGo } from '../../hooks/useGoNoGo';
import { useLeads } from '../../hooks/useLeads';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ScoreTierBadge } from '../../shared/ScoreTierBadge';
import { ExportButtons } from '../../shared/ExportButtons';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { ProvisioningStatusView } from '../../shared/ProvisioningStatus';
import { KickoffMeetingScheduler } from '../../shared/KickoffMeetingScheduler';
import { AzureADPeoplePicker } from '../../shared/AzureADPeoplePicker';
import { ProvisioningService } from '../../../services/ProvisioningService';
import { MockHubNavigationService } from '../../../services/HubNavigationService';
import {
  IGoNoGoScorecard as IScorecardModel,
  SCORECARD_CRITERIA,
  IScorecardCriterion,
  IScorecardVersion,
  IPersonAssignment,
  ILead,
  GoNoGoDecision,
  ScorecardStatus,
  RoleName,
  Stage,
  NotificationEvent,
  AuditAction,
  EntityType,
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
  6: { high: 'Yes', avg: 'Neutral', low: 'No or decision maker prefers other' },
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

const STATUS_COLORS: Record<ScorecardStatus, { bg: string; color: string }> = {
  [ScorecardStatus.Draft]: { bg: HBC_COLORS.gray100, color: HBC_COLORS.gray700 },
  [ScorecardStatus.Submitted]: { bg: '#DBEAFE', color: '#1D4ED8' },
  [ScorecardStatus.ReturnedForRevision]: { bg: '#FEF3C7', color: '#92400E' },
  [ScorecardStatus.InCommitteeReview]: { bg: '#EDE9FE', color: '#6D28D9' },
  [ScorecardStatus.PendingDecision]: { bg: '#FEF3C7', color: '#92400E' },
  [ScorecardStatus.Decided]: { bg: HBC_COLORS.successLight, color: '#065F46' },
  [ScorecardStatus.Locked]: { bg: HBC_COLORS.successLight, color: '#065F46' },
  [ScorecardStatus.Unlocked]: { bg: '#FED7AA', color: '#9A3412' },
};

export const GoNoGoScorecard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dataService, currentUser, hasPermission } = useAppContext();
  const {
    getScorecardByLeadId, createScorecard, updateScorecard,
    submitScorecard, respondToSubmission,
    enterCommitteeScores, recommendedDecision, computeRecommendation,
    recordDecision,
    canUnlock, unlockScorecard, relockScorecard,
    versions, currentVersion, loadVersions,
    scorecardStatus, isLocked, canEdit, canSubmit, canReview, canEnterCommitteeScores, canDecide,
  } = useGoNoGo();
  const { getLeadById, updateLead } = useLeads();
  const { notify } = useNotifications();
  const hubNavService = React.useMemo(() => new MockHubNavigationService(), []);
  const provisioningService = React.useMemo(() => new ProvisioningService(dataService, hubNavService), [dataService, hubNavService]);

  const [lead, setLead] = React.useState<ILead | null>(null);
  const [scorecard, setScorecard] = React.useState<IScorecardModel | null>(null);
  const [scores, setScores] = React.useState<IScorecardModel['scores']>({});
  const [qualFields, setQualFields] = React.useState<Record<string, string | number>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'warning' | 'error'>('success');
  const [provisioningCode, setProvisioningCode] = React.useState<string | null>(null);
  const [showKickoffScheduler, setShowKickoffScheduler] = React.useState(false);
  const [kickoffAttendees, setKickoffAttendees] = React.useState<string[]>([]);
  const [kickoffId, setKickoffId] = React.useState<number | null>(null);
  const [postGoRedirect, setPostGoRedirect] = React.useState<string | null>(null);

  // Workflow dialogs
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [submitApproverOverride, setSubmitApproverOverride] = React.useState<IPersonAssignment | null>(null);
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [returnComment, setReturnComment] = React.useState('');
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [decisionChoice, setDecisionChoice] = React.useState<GoNoGoDecision | ''>('');
  const [conditionalConditions, setConditionalConditions] = React.useState('');
  const [projectCode, setProjectCode] = React.useState('');
  const [projectCodeError, setProjectCodeError] = React.useState('');
  const [showUnlockDialog, setShowUnlockDialog] = React.useState(false);
  const [unlockReason, setUnlockReason] = React.useState('');
  const [showRelockOptions, setShowRelockOptions] = React.useState(false);
  const [showVersionHistory, setShowVersionHistory] = React.useState(false);
  const [showNoGoConfirm, setShowNoGoConfirm] = React.useState(false);
  const [showGoConfirm, setShowGoConfirm] = React.useState(false);

  const leadId = Number(id);

  // Determine user roles for RBAC
  const canScoreOriginator = hasPermission(PERMISSIONS.GONOGO_SCORE_ORIGINATOR);
  const canScoreCommittee = hasPermission(PERMISSIONS.GONOGO_SCORE_COMMITTEE);

  const handleKickoffScheduled = React.useCallback(async (meetingId: string, start: string, _end: string) => {
    if (kickoffId !== null) {
      await dataService.updateEstimatingKickoff(kickoffId, {
        KickoffMeetingId: meetingId,
        KickoffMeetingDate: start,
        ModifiedBy: currentUser?.email ?? 'system',
      });
    }
    notify(NotificationEvent.EstimatingKickoffScheduled, {
      leadTitle: lead?.Title,
      leadId,
      clientName: lead?.ClientName,
      projectCode,
      meetingDate: start,
    }).catch(console.error);
    setShowKickoffScheduler(false);
    if (postGoRedirect) navigate(postGoRedirect);
  }, [kickoffId, dataService, currentUser, notify, lead, leadId, projectCode, postGoRedirect, navigate]);

  const handleKickoffCancel = React.useCallback(() => {
    setShowKickoffScheduler(false);
    if (postGoRedirect) navigate(postGoRedirect);
  }, [postGoRedirect, navigate]);

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
          if (existing.ProjectCode) setProjectCode(existing.ProjectCode);
          // Load versions for locked/decided scorecards
          if (existing.versions?.length > 0) {
            loadVersions(existing.id).catch(console.error);
          }
        }
      } catch (err) {
        console.error('Failed to load scorecard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load().catch(console.error);
  }, [leadId, getLeadById, getScorecardByLeadId, loadVersions]);

  const handleScore = (criterionId: number, column: 'originator' | 'committee', value: number): void => {
    if (!canEdit && column === 'originator') return;
    if (column === 'originator' && !canScoreOriginator) return;
    if (column === 'committee' && !canScoreCommittee) return;
    // Committee scores only editable during InCommitteeReview or Unlocked
    if (column === 'committee' && !canEnterCommitteeScores && scorecardStatus !== ScorecardStatus.Unlocked) return;

    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [column]: value,
      },
    }));
  };

  const handleQualChange = (field: string, value: string | number): void => {
    if (!canEdit) return;
    setQualFields(prev => ({ ...prev, [field]: value }));
  };

  const origTotal = calculateTotalScore(scores, 'originator');
  const cmteTotal = calculateTotalScore(scores, 'committee');
  const origComplete = isScorecardComplete(scores, 'originator');
  const cmteComplete = isScorecardComplete(scores, 'committee');
  const origPct = getCompletionPercentage(scores, 'originator');
  const cmtePct = getCompletionPercentage(scores, 'committee');

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success'): void => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleSave = async (): Promise<IScorecardModel> => {
    setIsSaving(true);
    try {
      const data: Partial<IScorecardModel> = {
        LeadID: leadId,
        scores,
        TotalScore_Orig: origTotal,
        TotalScore_Cmte: cmteTotal,
        ScoredBy_Orig: canScoreOriginator ? currentUser?.email : scorecard?.ScoredBy_Orig,
        ...qualFields,
      };
      let saved: IScorecardModel;
      if (scorecard) {
        saved = await updateScorecard(scorecard.id, data);
      } else {
        saved = await createScorecard(data);
      }
      setScorecard(saved);
      dataService.logAudit({
        Action: AuditAction.GoNoGoScoreSubmitted,
        EntityType: EntityType.Scorecard,
        EntityId: String(saved.id),
        ProjectCode: lead?.ProjectCode,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        Details: `Scorecard saved for "${lead?.Title}" (Originator: ${origTotal}, Committee: ${cmteTotal})`,
      }).catch(console.error);
      showToast('Scorecard saved successfully');
      return saved;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async (): Promise<void> => {
    try {
      setIsSaving(true);
      // Save first
      const saved = await handleSave();
      // Submit for approval
      const updated = await submitScorecard(saved.id, submitApproverOverride ?? undefined);
      setScorecard(updated);
      setShowSubmitModal(false);

      notify(NotificationEvent.ScorecardSubmittedForReview, {
        leadTitle: lead?.Title,
        leadId,
        clientName: lead?.ClientName,
        submittedBy: currentUser?.displayName,
      }).catch(console.error);

      showToast('Scorecard submitted for Director review');
    } catch (err) {
      console.error('Failed to submit scorecard:', err);
      showToast('Failed to submit scorecard', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRespondToSubmission = async (approved: boolean): Promise<void> => {
    try {
      setIsSaving(true);
      const updated = await respondToSubmission(scorecard!.id, approved, returnComment);
      setScorecard(updated);
      setShowReturnDialog(false);
      setReturnComment('');

      if (approved) {
        showToast('Scorecard accepted. Committee scoring is now open.');
      } else {
        notify(NotificationEvent.ScorecardReturnedForRevision, {
          leadTitle: lead?.Title,
          leadId,
          returnComment,
        }).catch(console.error);
        showToast('Scorecard returned for revision', 'warning');
      }
    } catch (err) {
      console.error('Failed to respond to submission:', err);
      showToast('Failed to process response', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCommitteeScores = async (): Promise<void> => {
    try {
      setIsSaving(true);
      // Extract committee scores from the scores state
      const committeeScoreMap: Record<string, number> = {};
      for (const criterion of SCORECARD_CRITERIA) {
        const val = scores[criterion.id]?.committee;
        if (val !== undefined) committeeScoreMap[String(criterion.id)] = val;
      }
      const updated = await enterCommitteeScores(scorecard!.id, committeeScoreMap);
      setScorecard(updated);

      notify(NotificationEvent.ScorecardCommitteeScoresFinalized, {
        leadTitle: lead?.Title,
        leadId,
        committeeTotal: cmteTotal,
      }).catch(console.error);

      showToast('Committee scores finalized. Ready for decision.');
    } catch (err) {
      console.error('Failed to save committee scores:', err);
      showToast('Failed to save committee scores', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordDecision = async (): Promise<void> => {
    if (!decisionChoice) return;
    if (decisionChoice === GoNoGoDecision.Go) {
      if (!PROJECT_CODE_REGEX.test(projectCode)) {
        setProjectCodeError('Format must be yy-nnn-0m (e.g. 26-042-01)');
        return;
      }
      setProjectCodeError('');
    }

    try {
      setIsSaving(true);
      const updated = await recordDecision(
        scorecard!.id,
        decisionChoice,
        decisionChoice === GoNoGoDecision.ConditionalGo ? conditionalConditions : undefined,
      );
      setScorecard(updated);
      setShowDecisionPanel(false);
      setShowGoConfirm(false);
      setShowNoGoConfirm(false);

      // Update lead stage based on decision
      if (decisionChoice === GoNoGoDecision.Go || decisionChoice === GoNoGoDecision.ConditionalGo) {
        await updateLead(leadId, {
          Stage: Stage.Opportunity,
          GoNoGoDecision: decisionChoice,
          GoNoGoDecisionDate: new Date().toISOString(),
          GoNoGoScore_Originator: origTotal,
          GoNoGoScore_Committee: cmteTotal,
          ProjectCode: projectCode,
        });

        if (decisionChoice === GoNoGoDecision.Go) {
          setProvisioningCode(projectCode);

          // Create kickoff record
          const kickoff = await dataService.createEstimatingKickoff({
            LeadID: leadId,
            ProjectCode: projectCode,
            Architect: lead?.AE,
            ProposalDueDateTime: lead?.ProposalBidDue,
            CreatedBy: currentUser?.email ?? 'system',
            CreatedDate: new Date().toISOString(),
          });
          setKickoffId(kickoff.id);

          const attendees = new Set<string>();
          const addEmail = (value?: string): void => {
            if (value && value.includes('@')) attendees.add(value);
          };
          addEmail(currentUser?.email);
          addEmail(lead?.ProjectExecutive);
          addEmail(lead?.ProjectManager);
          try {
            const estimatingRecord = await dataService.getEstimatingByLeadId(leadId);
            addEmail(estimatingRecord?.LeadEstimator);
            addEmail(estimatingRecord?.PX_ProjectExecutive);
            (estimatingRecord?.Contributors || []).forEach(addEmail);
          } catch { /* ignore */ }

          setKickoffAttendees(Array.from(attendees));
          setShowKickoffScheduler(true);
          setPostGoRedirect(`/job-request/${leadId}`);
        }

        showToast(
          decisionChoice === GoNoGoDecision.Go
            ? `GO decision recorded. Project code ${projectCode} assigned.`
            : `CONDITIONAL GO decision recorded. Conditions documented.`
        );
      } else {
        await updateLead(leadId, {
          Stage: Stage.ArchivedNoGo,
          GoNoGoDecision: GoNoGoDecision.NoGo,
          GoNoGoDecisionDate: new Date().toISOString(),
          GoNoGoScore_Originator: origTotal,
          GoNoGoScore_Committee: cmteTotal,
        });
        showToast('NO GO decision recorded. Lead archived.', 'warning');
      }

      notify(NotificationEvent.ScorecardDecisionRecorded, {
        leadTitle: lead?.Title,
        leadId,
        decision: decisionChoice,
        score: cmteTotal || origTotal,
        projectCode: decisionChoice === GoNoGoDecision.Go ? projectCode : undefined,
      }).catch(console.error);

      dataService.logAudit({
        Action: AuditAction.ScorecardDecisionMade,
        EntityType: EntityType.Scorecard,
        EntityId: String(scorecard!.id),
        ProjectCode: decisionChoice === GoNoGoDecision.Go ? projectCode : undefined,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        Details: `Final decision: ${decisionChoice} for "${lead?.Title}" (Committee: ${cmteTotal})`,
      }).catch(console.error);
    } catch (err) {
      console.error('Failed to record decision:', err);
      showToast('Failed to record decision', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlock = async (): Promise<void> => {
    if (!unlockReason.trim()) return;
    try {
      setIsSaving(true);
      const updated = await unlockScorecard(scorecard!.id, unlockReason);
      setScorecard(updated);
      setShowUnlockDialog(false);
      setUnlockReason('');

      notify(NotificationEvent.ScorecardUnlockedForEditing, {
        leadTitle: lead?.Title,
        leadId,
        unlockedBy: currentUser?.displayName,
        reason: unlockReason,
      }).catch(console.error);

      showToast('Scorecard unlocked for editing', 'warning');
    } catch (err) {
      console.error('Failed to unlock scorecard:', err);
      showToast('Failed to unlock scorecard', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRelock = async (startNewCycle: boolean): Promise<void> => {
    try {
      setIsSaving(true);
      if (startNewCycle) {
        await handleSave();
      }
      const updated = await relockScorecard(scorecard!.id, startNewCycle);
      setScorecard(updated);
      setShowRelockOptions(false);
      showToast(startNewCycle ? 'Scorecard submitted for re-approval' : 'Scorecard re-locked');
    } catch (err) {
      console.error('Failed to re-lock scorecard:', err);
      showToast('Failed to re-lock scorecard', 'error');
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
  const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' };

  // Get return comments from latest approval cycle
  const activeCycle = scorecard?.approvalCycles?.find(c => c.status === 'Active');
  const returnedStep = activeCycle?.steps?.find(s => s.status === 'Returned');

  const currentStatus = scorecard?.scorecardStatus ?? ScorecardStatus.Draft;
  const statusColors = STATUS_COLORS[currentStatus];

  return (
    <div id="scorecard-view">
      <PageHeader
        title={`Go/No-Go Scorecard`}
        subtitle={`${lead.Title} — ${lead.ClientName}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Status Badge */}
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: statusColors.bg,
              color: statusColors.color,
            }}>
              {currentStatus}
              {scorecard?.currentVersion && scorecard.currentVersion > 1 ? ` (v${scorecard.currentVersion})` : ''}
            </span>
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
          backgroundColor: toastType === 'success' ? HBC_COLORS.successLight
            : toastType === 'warning' ? '#FEF3C7'
            : '#FEE2E2',
          color: toastType === 'success' ? '#065F46'
            : toastType === 'warning' ? '#92400E'
            : '#991B1B',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          {toastMessage}
        </div>
      )}

      {/* Status-specific Banners */}
      {currentStatus === ScorecardStatus.ReturnedForRevision && returnedStep && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Returned for Revision</div>
          <div style={{ color: '#92400E' }}>
            Returned by {returnedStep.assigneeName} on {returnedStep.actionDate ? new Date(returnedStep.actionDate).toLocaleDateString() : 'N/A'}
          </div>
          {returnedStep.comment && (
            <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fff', borderRadius: '4px', color: HBC_COLORS.gray700 }}>
              "{returnedStep.comment}"
            </div>
          )}
        </div>
      )}

      {currentStatus === ScorecardStatus.Submitted && canReview && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#DBEAFE',
          border: '1px solid #3B82F6',
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: 600, color: '#1D4ED8', marginBottom: '4px' }}>Awaiting Your Review</div>
          <div style={{ color: '#1D4ED8' }}>
            Submitted by {scorecard?.ScoredBy_Orig || 'BD Rep'} — Please review and accept or return for revision.
          </div>
        </div>
      )}

      {currentStatus === ScorecardStatus.Unlocked && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#FED7AA',
          border: '1px solid #F97316',
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: 600, color: '#9A3412', marginBottom: '4px' }}>Scorecard Unlocked</div>
          <div style={{ color: '#9A3412' }}>
            Unlocked by {scorecard?.unlockedBy || 'Unknown'} on {scorecard?.unlockedDate ? new Date(scorecard.unlockedDate).toLocaleDateString() : 'N/A'}
            {scorecard?.unlockReason && ` — Reason: ${scorecard.unlockReason}`}
          </div>
        </div>
      )}

      {(currentStatus === ScorecardStatus.Locked || currentStatus === ScorecardStatus.Decided) && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: HBC_COLORS.successLight,
          border: '1px solid #10B981',
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 20px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '15px',
              color: '#fff',
              backgroundColor: scorecard?.finalDecision === GoNoGoDecision.Go ? HBC_COLORS.success
                : scorecard?.finalDecision === GoNoGoDecision.NoGo ? HBC_COLORS.error
                : HBC_COLORS.warning,
            }}>
              {scorecard?.finalDecision || scorecard?.Decision || 'Decided'}
            </span>
            {scorecard?.finalDecisionDate && (
              <span style={{ color: '#065F46' }}>
                Decided on {new Date(scorecard.finalDecisionDate).toLocaleDateString()}
                {scorecard.finalDecisionBy && ` by ${scorecard.finalDecisionBy}`}
              </span>
            )}
            {scorecard?.ProjectCode && (
              <span style={{ fontWeight: 600, color: HBC_COLORS.navy }}>
                Project Code: {scorecard.ProjectCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Conditional Go Conditions Card */}
      {scorecard?.finalDecision === GoNoGoDecision.ConditionalGo && scorecard.conditionalGoConditions && (
        <div style={{
          ...cardStyle,
          borderLeft: `4px solid ${HBC_COLORS.warning}`,
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#92400E', margin: '0 0 8px 0' }}>
            Conditional Go — Required Conditions
          </h3>
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray700, whiteSpace: 'pre-wrap' }}>
            {scorecard.conditionalGoConditions}
          </div>
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
                canScoreOriginator={canScoreOriginator && canEdit}
                canScoreCommittee={canScoreCommittee && (canEnterCommitteeScores || scorecardStatus === ScorecardStatus.Unlocked)}
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
      <div style={cardStyle}>
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
              disabled={!canEdit || !canScoreOriginator}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Committee Comments</label>
            <Textarea
              style={{ width: '100%' }}
              rows={3}
              value={String(qualFields.CommitteeComments || '')}
              onChange={(_, d) => handleQualChange('CommitteeComments', d.value)}
              disabled={!canEdit || !canScoreCommittee}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Proposal Marketing Comments</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.ProposalMarketingComments || '')}
              onChange={(_, d) => handleQualChange('ProposalMarketingComments', d.value)}
              disabled={!canEdit}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Marketing Resources</label>
              <Input
                style={{ width: '100%' }}
                value={String(qualFields.ProposalMarketingResources || '')}
                onChange={(_, d) => handleQualChange('ProposalMarketingResources', d.value)}
                disabled={!canEdit}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Marketing Hours</label>
              <Input
                type="number"
                style={{ width: '100%' }}
                value={String(qualFields.ProposalMarketingHours || '')}
                onChange={(_, d) => handleQualChange('ProposalMarketingHours', Number(d.value))}
                disabled={!canEdit}
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
              disabled={!canEdit}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Estimating Resources</label>
              <Input
                style={{ width: '100%' }}
                value={String(qualFields.EstimatingResources || '')}
                onChange={(_, d) => handleQualChange('EstimatingResources', d.value)}
                disabled={!canEdit}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Estimating Hours</label>
              <Input
                type="number"
                style={{ width: '100%' }}
                value={String(qualFields.EstimatingHours || '')}
                onChange={(_, d) => handleQualChange('EstimatingHours', Number(d.value))}
                disabled={!canEdit}
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
              disabled={!canEdit}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>HB Differentiators</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.HBDifferentiators || '')}
              onChange={(_, d) => handleQualChange('HBDifferentiators', d.value)}
              disabled={!canEdit}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Win Strategy</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={String(qualFields.WinStrategy || '')}
              onChange={(_, d) => handleQualChange('WinStrategy', d.value)}
              disabled={!canEdit}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Strategic Pursuit</label>
            <Input
              style={{ width: '100%' }}
              value={String(qualFields.StrategicPursuit || '')}
              onChange={(_, d) => handleQualChange('StrategicPursuit', d.value)}
              disabled={!canEdit}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Decision Maker Advocate</label>
            <Input
              style={{ width: '100%' }}
              value={String(qualFields.DecisionMakerAdvocate || '')}
              onChange={(_, d) => handleQualChange('DecisionMakerAdvocate', d.value)}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Recommendation Card — only in PendingDecision */}
      {currentStatus === ScorecardStatus.PendingDecision && recommendedDecision && (
        <div style={{
          ...cardStyle,
          borderLeft: `4px solid ${
            recommendedDecision.decision === GoNoGoDecision.Go ? HBC_COLORS.success
            : recommendedDecision.decision === GoNoGoDecision.NoGo ? HBC_COLORS.error
            : HBC_COLORS.warning
          }`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                System Recommendation — not the final decision
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: HBC_COLORS.gray800, marginBottom: '4px' }}>
                {recommendedDecision.decision}
              </div>
              <div style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>
                {recommendedDecision.reasoning}
              </div>
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: recommendedDecision.confidence === 'Strong' ? '#D1FAE5' : '#FEF3C7',
              color: recommendedDecision.confidence === 'Strong' ? '#065F46' : '#92400E',
            }}>
              {recommendedDecision.confidence} confidence
            </span>
          </div>
        </div>
      )}

      {/* Action Bar — context-sensitive based on status */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
          {currentStatus === ScorecardStatus.Draft || currentStatus === ScorecardStatus.ReturnedForRevision
            ? 'Actions'
            : currentStatus === ScorecardStatus.Submitted ? 'Review Actions'
            : currentStatus === ScorecardStatus.InCommitteeReview ? 'Committee Scoring'
            : currentStatus === ScorecardStatus.PendingDecision ? 'Final Decision'
            : currentStatus === ScorecardStatus.Unlocked ? 'Unlocked Actions'
            : 'Status'}
        </h3>

        {/* Draft / ReturnedForRevision: Cancel, Save, Save & Submit */}
        {(currentStatus === ScorecardStatus.Draft || currentStatus === ScorecardStatus.ReturnedForRevision) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button appearance="secondary" onClick={() => navigate(`/lead/${leadId}`)}>Cancel</Button>
            <Button appearance="secondary" onClick={() => handleSave()} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            {canSubmit && (
              <Button appearance="primary" onClick={() => setShowSubmitModal(true)} disabled={isSaving}>
                Save & Submit for Review
              </Button>
            )}
          </div>
        )}

        {/* Submitted: Return or Accept (for reviewer) */}
        {currentStatus === ScorecardStatus.Submitted && canReview && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="secondary"
              style={{ borderColor: HBC_COLORS.warning, color: '#92400E' }}
              onClick={() => setShowReturnDialog(true)}
              disabled={isSaving}
            >
              Return for Revision
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleRespondToSubmission(true)}
              disabled={isSaving}
            >
              Accept & Proceed to Committee
            </Button>
          </div>
        )}

        {currentStatus === ScorecardStatus.Submitted && !canReview && (
          <div style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
            Submitted for review. Waiting for Director approval.
          </div>
        )}

        {/* InCommitteeReview: Save Committee Scores / Finalize */}
        {currentStatus === ScorecardStatus.InCommitteeReview && (
          <div>
            {canEnterCommitteeScores ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  appearance="secondary"
                  onClick={() => { handleSave().catch(console.error); }}
                  disabled={isSaving}
                >
                  Save Committee Scores
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleSaveCommitteeScores}
                  disabled={isSaving || !cmteComplete}
                >
                  Finalize Committee Scores
                </Button>
                {!cmteComplete && (
                  <span style={{ fontSize: '12px', color: HBC_COLORS.gray400, alignSelf: 'center' }}>
                    All 19 committee scores required to finalize
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                Committee scoring in progress. Only Executive Leadership can enter scores.
              </div>
            )}
          </div>
        )}

        {/* PendingDecision: Decision buttons */}
        {currentStatus === ScorecardStatus.PendingDecision && (
          <div>
            {canDecide ? (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <Button
                    appearance="primary"
                    style={{ backgroundColor: HBC_COLORS.success }}
                    disabled={isSaving}
                    onClick={() => { setDecisionChoice(GoNoGoDecision.Go); setShowGoConfirm(true); }}
                  >
                    GO
                  </Button>
                  <Button
                    appearance="primary"
                    style={{ backgroundColor: HBC_COLORS.error }}
                    disabled={isSaving}
                    onClick={() => { setDecisionChoice(GoNoGoDecision.NoGo); setShowNoGoConfirm(true); }}
                  >
                    NO GO
                  </Button>
                  <Button
                    appearance="primary"
                    style={{ backgroundColor: HBC_COLORS.warning }}
                    disabled={isSaving}
                    onClick={() => { setDecisionChoice(GoNoGoDecision.ConditionalGo); setShowDecisionPanel(true); }}
                  >
                    CONDITIONAL GO
                  </Button>
                </div>

                {/* GO confirm panel with project code */}
                {showGoConfirm && (
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
                      <Button appearance="primary" onClick={handleRecordDecision} disabled={isSaving}>
                        Confirm GO
                      </Button>
                      <Button appearance="secondary" onClick={() => setShowGoConfirm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Conditional Go panel with conditions */}
                {showDecisionPanel && decisionChoice === GoNoGoDecision.ConditionalGo && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '6px',
                    marginBottom: '12px',
                  }}>
                    <label style={labelStyle}>Conditions for Approval *</label>
                    <Textarea
                      style={{ width: '100%', marginBottom: '12px' }}
                      rows={3}
                      value={conditionalConditions}
                      onChange={(_, d) => setConditionalConditions(d.value)}
                      placeholder="Describe the conditions that must be met..."
                    />
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
                      <Button
                        appearance="primary"
                        style={{ backgroundColor: HBC_COLORS.warning }}
                        onClick={handleRecordDecision}
                        disabled={isSaving || !conditionalConditions.trim()}
                      >
                        Confirm Conditional Go
                      </Button>
                      <Button appearance="secondary" onClick={() => setShowDecisionPanel(false)}>Cancel</Button>
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
        )}

        {/* Locked: Unlock button */}
        {(currentStatus === ScorecardStatus.Locked || currentStatus === ScorecardStatus.Decided) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {canUnlock && (
              <Button
                appearance="secondary"
                style={{ borderColor: '#F97316', color: '#9A3412' }}
                onClick={() => setShowUnlockDialog(true)}
              >
                Unlock for Editing
              </Button>
            )}
            <Button appearance="secondary" onClick={() => setShowVersionHistory(!showVersionHistory)}>
              {showVersionHistory ? 'Hide' : 'Show'} Version History ({scorecard?.versions?.length || 0})
            </Button>
          </div>
        )}

        {/* Unlocked: Save/Lock/Submit */}
        {currentStatus === ScorecardStatus.Unlocked && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button appearance="secondary" onClick={() => handleSave().catch(console.error)} disabled={isSaving}>
              Save
            </Button>
            <Button
              appearance="secondary"
              style={{ borderColor: HBC_COLORS.success, color: '#065F46' }}
              onClick={() => handleRelock(false)}
              disabled={isSaving}
            >
              Lock Without Re-approval
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleRelock(true)}
              disabled={isSaving}
            >
              Save & Submit for Re-approval
            </Button>
          </div>
        )}
      </div>

      {/* Version History Panel */}
      {showVersionHistory && scorecard?.versions && scorecard.versions.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
            Version History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...scorecard.versions].reverse().map((ver) => (
              <div key={ver.id} style={{
                padding: '12px 16px',
                backgroundColor: HBC_COLORS.gray50,
                borderRadius: '6px',
                border: `1px solid ${HBC_COLORS.gray200}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: HBC_COLORS.gray800 }}>
                    Version {ver.versionNumber}
                  </span>
                  <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>
                    {new Date(ver.createdDate).toLocaleString()} by {ver.createdBy}
                  </span>
                </div>
                {ver.reason && (
                  <div style={{ fontSize: '12px', color: HBC_COLORS.gray600, marginBottom: '8px' }}>
                    Reason: {ver.reason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <span>Originator: <strong>{ver.totalOriginal ?? 'N/A'}</strong></span>
                  <span>Committee: <strong>{ver.totalCommittee ?? 'N/A'}</strong></span>
                  {ver.decision && (
                    <span>Decision: <strong style={{
                      color: ver.decision === GoNoGoDecision.Go ? HBC_COLORS.success
                        : ver.decision === GoNoGoDecision.NoGo ? HBC_COLORS.error
                        : HBC_COLORS.warning,
                    }}>{ver.decision}</strong></span>
                  )}
                </div>
                {ver.conditions && (
                  <div style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>
                    Conditions: {ver.conditions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provisioning Progress */}
      {provisioningCode && (
        <div style={{ marginTop: '24px' }}>
          <ProvisioningStatusView projectCode={provisioningCode} pollInterval={800} />
        </div>
      )}

      {showKickoffScheduler && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 24,
        }}>
          <div style={{ maxWidth: 560, width: '100%' }}>
            <KickoffMeetingScheduler
              attendeeEmails={kickoffAttendees}
              leadId={leadId}
              projectCode={projectCode}
              onScheduled={handleKickoffScheduled}
              onCancel={handleKickoffCancel}
            />
          </div>
        </div>
      )}

      {/* Submit for Review Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 24,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
              Submit Scorecard for Review
            </h3>
            <p style={{ fontSize: '13px', color: HBC_COLORS.gray600, marginBottom: '16px' }}>
              This will submit the scorecard for Director of Preconstruction review. You can optionally override the approver below.
            </p>
            <AzureADPeoplePicker
              selectedUser={submitApproverOverride}
              onSelect={setSubmitApproverOverride}
              label="Approver (defaults to Director of Precon)"
              placeholder="Override approver..."
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button appearance="secondary" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleSubmitForReview} disabled={isSaving}>
                {isSaving ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Revision Dialog */}
      {showReturnDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 24,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#92400E', margin: '0 0 16px 0' }}>
              Return for Revision
            </h3>
            <label style={labelStyle}>Comments / Reason for Return *</label>
            <Textarea
              style={{ width: '100%' }}
              rows={3}
              value={returnComment}
              onChange={(_, d) => setReturnComment(d.value)}
              placeholder="Explain what needs to be revised..."
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button appearance="secondary" onClick={() => { setShowReturnDialog(false); setReturnComment(''); }}>Cancel</Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: HBC_COLORS.warning }}
                onClick={() => handleRespondToSubmission(false)}
                disabled={isSaving || !returnComment.trim()}
              >
                Return
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Dialog */}
      {showUnlockDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 24,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#9A3412', margin: '0 0 16px 0' }}>
              Unlock Scorecard
            </h3>
            <p style={{ fontSize: '13px', color: HBC_COLORS.gray600, marginBottom: '16px' }}>
              This will create a version snapshot and unlock the scorecard for editing. A reason is required.
            </p>
            <label style={labelStyle}>Reason for Unlock *</label>
            <Textarea
              style={{ width: '100%' }}
              rows={2}
              value={unlockReason}
              onChange={(_, d) => setUnlockReason(d.value)}
              placeholder="Why does this scorecard need to be unlocked?"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button appearance="secondary" onClick={() => { setShowUnlockDialog(false); setUnlockReason(''); }}>Cancel</Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: '#F97316' }}
                onClick={handleUnlock}
                disabled={isSaving || !unlockReason.trim()}
              >
                Unlock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showNoGoConfirm}
        title="Confirm NO GO"
        message={`This will archive "${lead.Title}" as No-Go. This action cannot be undone.`}
        confirmLabel="Confirm NO GO"
        onConfirm={handleRecordDecision}
        onCancel={() => setShowNoGoConfirm(false)}
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
    canEditCol: boolean,
  ): React.ReactElement => {
    const isSelected = scores?.[column] === value;
    return (
      <button
        onClick={() => canEditCol && onScore(criterion.id, column, value)}
        disabled={!canEditCol}
        style={{
          width: '36px',
          height: '28px',
          border: isSelected ? `2px solid ${HBC_COLORS.navy}` : `1px solid ${HBC_COLORS.gray200}`,
          borderRadius: '4px',
          backgroundColor: isSelected ? HBC_COLORS.navy : '#fff',
          color: isSelected ? '#fff' : HBC_COLORS.gray700,
          fontWeight: isSelected ? 700 : 400,
          fontSize: '12px',
          cursor: canEditCol ? 'pointer' : 'not-allowed',
          opacity: canEditCol ? 1 : 0.5,
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
