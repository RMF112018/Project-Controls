import * as React from 'react';
import { IBuyoutEntry, IResolvedWorkflowStep, ContractTrackingStep } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { ContractTrackingPanel } from './ContractTrackingPanel';

export interface IContractTrackingSubmitModalProps {
  entry: IBuyoutEntry;
  resolvedChain: IResolvedWorkflowStep[];
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const STEP_ORDER: ContractTrackingStep[] = ['APM_PA', 'ProjectManager', 'RiskManager', 'ProjectExecutive'];

const STEP_LABELS: Record<ContractTrackingStep, string> = {
  APM_PA: 'APM / PA',
  ProjectManager: 'Project Manager',
  RiskManager: 'Risk Manager',
  ProjectExecutive: 'Project Executive',
};

export const ContractTrackingSubmitModal: React.FC<IContractTrackingSubmitModalProps> = ({
  entry,
  resolvedChain,
  loading,
  onSubmit,
  onClose,
}) => {
  const { isFeatureEnabled } = useAppContext();
  const [submitted, setSubmitted] = React.useState(false);
  const [previewEntry, setPreviewEntry] = React.useState<IBuyoutEntry | null>(null);

  const showDevPreview = isFeatureEnabled('ContractTrackingDevPreview');

  const handleSubmit = (): void => {
    onSubmit();
    if (showDevPreview) {
      // Simulate what the entry will look like after submission
      const firstSkipped = resolvedChain.find(s => s.stepOrder === 1 && s.skipped);
      const firstStep: ContractTrackingStep = firstSkipped ? 'ProjectManager' : 'APM_PA';
      setPreviewEntry({
        ...entry,
        contractTrackingStatus: firstStep === 'APM_PA' ? 'PendingAPM' : 'PendingPM',
        currentContractTrackingStep: firstStep,
        contractTrackingHistory: [
          ...(firstSkipped ? [{
            id: -2,
            buyoutEntryId: entry.id,
            projectCode: entry.projectCode,
            step: 'APM_PA' as ContractTrackingStep,
            approverName: 'N/A',
            approverEmail: '',
            status: 'Skipped' as const,
            actionDate: new Date().toISOString(),
            skippedReason: 'No APM/PA assigned for this project',
          }] : []),
          {
            id: -1,
            buyoutEntryId: entry.id,
            projectCode: entry.projectCode,
            step: firstStep,
            approverName: resolvedChain.find(s => s.stepOrder === (firstSkipped ? 2 : 1))?.assignee?.displayName ?? STEP_LABELS[firstStep],
            approverEmail: resolvedChain.find(s => s.stepOrder === (firstSkipped ? 2 : 1))?.assignee?.email ?? '',
            status: 'Pending' as const,
          },
        ],
      });
      setSubmitted(true);
    }
  };

  // Dev Preview mode — show what the next approver will see
  if (submitted && previewEntry && showDevPreview) {
    return (
      <div>
        <div style={{
          padding: '8px 12px', borderRadius: 6, marginBottom: 16,
          backgroundColor: '#FFF7ED', border: `1px solid ${HBC_COLORS.warning}`,
          fontSize: 11, fontWeight: 600, color: '#92400E',
        }}>
          Dev Preview — Next approver view
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: HBC_COLORS.navy }}>
          {entry.divisionDescription} — {entry.subcontractorName || 'TBD'}
        </h3>

        {/* Entry Details Card */}
        <div style={{ ...cardStyle, padding: 12, marginBottom: 16, fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><span style={labelStyle}>Division:</span> {entry.divisionCode} — {entry.divisionDescription}</div>
            <div><span style={labelStyle}>Subcontractor:</span> {entry.subcontractorName || '—'}</div>
            <div><span style={labelStyle}>Contract Value:</span> {entry.contractValue != null ? fmt(entry.contractValue) : '—'}</div>
            <div><span style={labelStyle}>Status:</span> {entry.commitmentStatus}</div>
          </div>
        </div>

        <ContractTrackingPanel
          entry={previewEntry}
          canApproveAPM={false}
          canApprovePM={false}
          canApproveRisk={false}
          canApprovePX={false}
          onApprove={() => {}}
          onReject={() => {}}
          resolvedChain={resolvedChain}
        />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button onClick={onClose} style={btnOutline}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy }}>
        Submit for Contract Tracking
      </h3>

      {/* Entry Summary Card */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 20, fontSize: 13 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><span style={labelStyle}>Division:</span> {entry.divisionCode} — {entry.divisionDescription}</div>
          <div><span style={labelStyle}>Subcontractor:</span> {entry.subcontractorName || '—'}</div>
          <div><span style={labelStyle}>Contract Value:</span> {entry.contractValue != null ? fmt(entry.contractValue) : '—'}</div>
          <div><span style={labelStyle}>Commitment:</span> {entry.commitmentStatus}</div>
          <div>
            <span style={labelStyle}>SDI:</span>{' '}
            <span style={{ color: entry.enrolledInSDI ? HBC_COLORS.success : HBC_COLORS.gray400 }}>
              {entry.enrolledInSDI ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span style={labelStyle}>Bond:</span>{' '}
            <span style={{ color: entry.bondRequired ? HBC_COLORS.warning : HBC_COLORS.gray400 }}>
              {entry.bondRequired ? 'Required' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Resolved Approval Chain */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 10 }}>
          Approval Chain
        </div>
        {STEP_ORDER.map((step, i) => {
          const chainStep = resolvedChain.find(s => s.stepOrder === i + 1);
          const isSkipped = chainStep?.skipped;
          const assignee = chainStep?.assignee?.displayName ?? STEP_LABELS[step];

          return (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 12px', marginBottom: 4,
              borderRadius: 6,
              backgroundColor: isSkipped ? HBC_COLORS.gray50 : '#fff',
              border: `1px solid ${HBC_COLORS.gray200}`,
              opacity: isSkipped ? 0.6 : 1,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: isSkipped ? HBC_COLORS.gray300 : HBC_COLORS.navy,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isSkipped ? HBC_COLORS.gray400 : HBC_COLORS.gray800 }}>
                  {STEP_LABELS[step]}
                  {isSkipped && <span style={{ fontSize: 10, color: HBC_COLORS.gray400, marginLeft: 8 }}>(Skipped)</span>}
                </div>
                <div style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>
                  {assignee}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btnOutline}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{
          ...btnPrimary,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Submitting...' : 'Submit for Tracking'}
        </button>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  boxShadow: ELEVATION.level1,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600, color: HBC_COLORS.gray600,
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', backgroundColor: HBC_COLORS.navy, color: '#fff',
  border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

const btnOutline: React.CSSProperties = {
  padding: '8px 20px', backgroundColor: '#fff', color: HBC_COLORS.gray600,
  border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: 'pointer',
};
