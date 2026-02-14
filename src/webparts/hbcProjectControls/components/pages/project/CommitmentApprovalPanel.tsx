import * as React from 'react';
import { IBuyoutEntry, ICommitmentApproval, CommitmentStatus } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

export interface ICommitmentApprovalPanelProps {
  entry: IBuyoutEntry;
  canApprovePX: boolean;
  canApproveCompliance: boolean;
  canApproveCFO: boolean;
  canEscalate: boolean;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  onEscalate: (comment: string) => void;
}

const STATUS_CONFIG: Record<CommitmentStatus, { label: string; bg: string; color: string }> = {
  Budgeted: { label: 'Budgeted', bg: HBC_COLORS.gray100, color: HBC_COLORS.gray700 },
  PendingReview: { label: 'Pending PX Review', bg: HBC_COLORS.warningLight, color: '#92400E' },
  WaiverPending: { label: 'Waiver Pending', bg: '#FFF7ED', color: '#C2410C' },
  PXApproved: { label: 'PX Approved', bg: '#DBEAFE', color: '#1E40AF' },
  ComplianceReview: { label: 'Compliance Review', bg: '#F3E8FF', color: '#6B21A8' },
  CFOReview: { label: 'CFO Review', bg: HBC_COLORS.errorLight, color: '#991B1B' },
  Committed: { label: 'Fully Committed', bg: HBC_COLORS.successLight, color: '#065F46' },
  Rejected: { label: 'Rejected', bg: HBC_COLORS.errorLight, color: '#991B1B' },
};

const stepLabel = (step: string): string => {
  switch (step) {
    case 'PX': return 'Project Executive';
    case 'ComplianceManager': return 'Compliance Manager';
    case 'CFO': return 'Chief Financial Officer';
    default: return step;
  }
};

const approvalStatusColor = (status: string): string => {
  switch (status) {
    case 'Approved': return HBC_COLORS.success;
    case 'Rejected': return HBC_COLORS.error;
    case 'Escalated': return HBC_COLORS.warning;
    default: return HBC_COLORS.gray400;
  }
};

export const CommitmentApprovalPanel: React.FC<ICommitmentApprovalPanelProps> = ({
  entry,
  canApprovePX,
  canApproveCompliance,
  canApproveCFO,
  canEscalate,
  onApprove,
  onReject,
  onEscalate,
}) => {
  const [comment, setComment] = React.useState('');
  const statusConfig = STATUS_CONFIG[entry.commitmentStatus] || STATUS_CONFIG.Budgeted;

  const currentStep = entry.currentApprovalStep;
  const canAct =
    (currentStep === 'PX' && canApprovePX) ||
    (currentStep === 'ComplianceManager' && canApproveCompliance) ||
    (currentStep === 'CFO' && canApproveCFO);

  const history: ICommitmentApproval[] = entry.approvalHistory || [];

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

      {/* Current Step Info */}
      {currentStep && (
        <div style={{
          padding: 12,
          borderRadius: 6,
          border: `2px solid ${HBC_COLORS.orange}`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: HBC_COLORS.orange, marginBottom: 4 }}>
            Pending: {stepLabel(currentStep)}
          </div>
          {entry.waiverRequired && (
            <div style={{ fontSize: 11, color: HBC_COLORS.gray600 }}>
              Waiver Type: {entry.waiverType ?? 'N/A'}
              {entry.waiverReason && ` — ${entry.waiverReason}`}
            </div>
          )}
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
                flex: 1,
                padding: 8,
                backgroundColor: HBC_COLORS.success,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { onReject(comment); setComment(''); }}
              style={{
                flex: 1,
                padding: 8,
                backgroundColor: HBC_COLORS.error,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Reject
            </button>
            {canEscalate && currentStep === 'ComplianceManager' && (
              <button
                type="button"
                onClick={() => { onEscalate(comment); setComment(''); }}
                style={{
                  flex: 1,
                  padding: 8,
                  backgroundColor: HBC_COLORS.warning,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Escalate to CFO
              </button>
            )}
          </div>
        </div>
      )}

      {/* Approval History Timeline */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 8 }}>
            Approval History
          </div>
          {history.map((step, i) => (
            <div
              key={step.id || i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 0',
                borderBottom: i < history.length - 1 ? `1px solid ${HBC_COLORS.gray100}` : 'none',
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: approvalStatusColor(step.status),
                marginTop: 4,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray800 }}>
                  {stepLabel(step.step)} — {step.approverName}
                </div>
                <div style={{ fontSize: 11, color: approvalStatusColor(step.status), fontWeight: 600 }}>
                  {step.status}
                </div>
                {step.comment && (
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray500, fontStyle: 'italic', marginTop: 2 }}>
                    &ldquo;{step.comment}&rdquo;
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
