import * as React from 'react';
import { IBuyoutEntry, IContractTrackingApproval, ContractTrackingStep, ContractTrackingStatus, IResolvedWorkflowStep } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

export interface IContractTrackingPanelProps {
  entry: IBuyoutEntry;
  canApproveAPM: boolean;
  canApprovePM: boolean;
  canApproveRisk: boolean;
  canApprovePX: boolean;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  resolvedChain?: IResolvedWorkflowStep[];
}

const STEP_ORDER: ContractTrackingStep[] = ['APM_PA', 'ProjectManager', 'RiskManager', 'ProjectExecutive'];

const STEP_LABELS: Record<ContractTrackingStep, string> = {
  APM_PA: 'APM / PA',
  ProjectManager: 'Project Manager',
  RiskManager: 'Risk Manager',
  ProjectExecutive: 'Project Executive',
};

const STATUS_CONFIG: Record<ContractTrackingStatus, { label: string; bg: string; color: string }> = {
  NotStarted:    { label: 'Not Started',   bg: HBC_COLORS.gray200,      color: HBC_COLORS.gray700 },
  PendingAPM:    { label: 'APM/PA Review', bg: HBC_COLORS.warningLight, color: '#92400E' },
  PendingPM:     { label: 'PM Review',     bg: '#DBEAFE',               color: '#1E40AF' },
  PendingRiskMgr:{ label: 'Risk Review',   bg: '#F3E8FF',               color: '#6B21A8' },
  PendingPX:     { label: 'PX Review',     bg: '#FEF3C7',               color: '#92400E' },
  Tracked:       { label: 'Tracked',       bg: HBC_COLORS.successLight, color: '#065F46' },
  Rejected:      { label: 'Rejected',      bg: HBC_COLORS.errorLight,   color: '#991B1B' },
};

const approvalStatusColor = (status: string): string => {
  switch (status) {
    case 'Approved': return HBC_COLORS.success;
    case 'Rejected': return HBC_COLORS.error;
    case 'Skipped': return HBC_COLORS.gray400;
    default: return HBC_COLORS.warning;
  }
};

export const ContractTrackingPanel: React.FC<IContractTrackingPanelProps> = ({
  entry,
  canApproveAPM,
  canApprovePM,
  canApproveRisk,
  canApprovePX,
  onApprove,
  onReject,
  resolvedChain,
}) => {
  const [comment, setComment] = React.useState('');
  const status = entry.contractTrackingStatus || 'NotStarted';
  const currentStep = entry.currentContractTrackingStep;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.NotStarted;

  const canAct =
    (currentStep === 'APM_PA' && canApproveAPM) ||
    (currentStep === 'ProjectManager' && canApprovePM) ||
    (currentStep === 'RiskManager' && canApproveRisk) ||
    (currentStep === 'ProjectExecutive' && canApprovePX);

  const history: IContractTrackingApproval[] = entry.contractTrackingHistory || [];

  // Determine step status for stepper
  const getStepState = (step: ContractTrackingStep): 'past' | 'current' | 'future' | 'skipped' => {
    const record = history.find(h => h.step === step);
    if (record?.status === 'Skipped') return 'skipped';
    if (record?.status === 'Approved') return 'past';
    if (step === currentStep) return 'current';
    return 'future';
  };

  // Find approver name for a step from resolved chain or history
  const getApproverName = (step: ContractTrackingStep): string => {
    const record = history.find(h => h.step === step);
    if (record) return record.approverName;
    const chainStep = resolvedChain?.find(s => {
      const stepIdx = STEP_ORDER.indexOf(step);
      return s.stepOrder === stepIdx + 1;
    });
    if (chainStep?.assignee?.displayName) return chainStep.assignee.displayName;
    return STEP_LABELS[step];
  };

  return (
    <div>
      {/* Status Badge */}
      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: statusConfig.bg,
        color: statusConfig.color,
        marginBottom: 16,
      }}>
        {statusConfig.label}
      </div>

      {/* 4-Step Visual Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, padding: '0 8px' }}>
        {STEP_ORDER.map((step, i) => {
          const state = getStepState(step);
          const circleColor = state === 'past' ? HBC_COLORS.success
            : state === 'current' ? HBC_COLORS.orange
            : state === 'skipped' ? HBC_COLORS.gray300
            : HBC_COLORS.gray200;
          const textColor = state === 'past' ? HBC_COLORS.success
            : state === 'current' ? HBC_COLORS.orange
            : HBC_COLORS.gray400;

          return (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: circleColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: state === 'future' || state === 'skipped' ? HBC_COLORS.gray500 : '#fff',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {state === 'past' ? '\u2713' : state === 'skipped' ? '\u2014' : i + 1}
                </div>
                <div style={{ fontSize: 10, color: textColor, fontWeight: 600, marginTop: 4, textAlign: 'center' }}>
                  {STEP_LABELS[step]}
                </div>
              </div>
              {i < STEP_ORDER.length - 1 && (
                <div style={{
                  flex: 0.5,
                  height: 2,
                  backgroundColor: state === 'past' ? HBC_COLORS.success : HBC_COLORS.gray200,
                  marginTop: -14,
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Step Info */}
      {currentStep && (
        <div style={{
          padding: 12,
          borderRadius: 6,
          border: `2px solid ${HBC_COLORS.orange}`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: HBC_COLORS.orange, marginBottom: 4 }}>
            Pending: {STEP_LABELS[currentStep]} — {getApproverName(currentStep)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canAct && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Comment (optional)..."
            style={{
              width: '100%',
              border: `1px solid ${HBC_COLORS.gray200}`,
              borderRadius: 4,
              padding: 8,
              fontSize: 12,
              minHeight: 40,
              resize: 'vertical',
              marginBottom: 8,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { onApprove(comment); setComment(''); }}
              style={{
                flex: 1, padding: 8,
                backgroundColor: HBC_COLORS.success, color: '#fff',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { onReject(comment); setComment(''); }}
              style={{
                flex: 1, padding: 8,
                backgroundColor: HBC_COLORS.error, color: '#fff',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Approval History Timeline */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 8 }}>
            Tracking History
          </div>
          {history.map((step, i) => (
            <div
              key={step.id || i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0',
                borderBottom: i < history.length - 1 ? `1px solid ${HBC_COLORS.gray100}` : 'none',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: approvalStatusColor(step.status),
                marginTop: 4, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray800 }}>
                  {STEP_LABELS[step.step]} — {step.approverName}
                </div>
                <div style={{ fontSize: 11, color: approvalStatusColor(step.status), fontWeight: 600 }}>
                  {step.status}
                </div>
                {step.comment && (
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray500, fontStyle: 'italic', marginTop: 2 }}>
                    &ldquo;{step.comment}&rdquo;
                  </div>
                )}
                {step.skippedReason && (
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray400, fontStyle: 'italic', marginTop: 2 }}>
                    {step.skippedReason}
                  </div>
                )}
                {step.actionDate && (
                  <div style={{ fontSize: 10, color: HBC_COLORS.gray400, marginTop: 2 }}>
                    {new Date(step.actionDate).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
