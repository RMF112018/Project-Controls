import * as React from 'react';
import { HBC_COLORS, ELEVATION } from '../../../../theme/tokens';
import { IProjectManagementPlan, IPMPApprovalCycle } from '../../../../models/IProjectManagementPlan';

interface IPMPApprovalPanelProps {
  pmp: IProjectManagementPlan;
  canSubmit: boolean;
  canApprove: boolean;
  onSubmit: () => void;
  onApprovalResponse: (stepId: number, approved: boolean, comment: string) => void;
}

const STEP_COLORS: Record<string, string> = {
  Pending: HBC_COLORS.gray400,
  Approved: HBC_COLORS.success,
  Returned: HBC_COLORS.error,
};

export const PMPApprovalPanel: React.FC<IPMPApprovalPanelProps> = ({ pmp, canSubmit, canApprove, onSubmit, onApprovalResponse }) => {
  const [approvalComment, setApprovalComment] = React.useState('');
  const currentCycle = pmp.approvalCycles.find(c => c.cycleNumber === pmp.currentCycleNumber);
  const pendingStep = currentCycle?.steps.find(s => s.status === 'Pending');

  const requiredSigs = pmp.startupSignatures.filter(s => s.isRequired);
  const signedCount = requiredSigs.filter(s => s.status === 'Signed').length;
  const allSigned = signedCount === requiredSigs.length && requiredSigs.length > 0;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: ELEVATION.level1 }}>
      <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy, fontSize: 16 }}>Approval Status</h3>

      {/* Status badge */}
      <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, backgroundColor: HBC_COLORS.gray50, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>Current Status</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy, marginTop: 4 }}>{pmp.status}</div>
      </div>

      {/* Signature progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 4 }}>Signatures: {signedCount}/{requiredSigs.length} required</div>
        <div style={{ height: 6, backgroundColor: HBC_COLORS.gray200, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${requiredSigs.length > 0 ? (signedCount / requiredSigs.length) * 100 : 0}%`, height: '100%', backgroundColor: allSigned ? HBC_COLORS.success : HBC_COLORS.orange, borderRadius: 3 }} />
        </div>
      </div>

      {/* Submit button */}
      {canSubmit && (pmp.status === 'Draft' || pmp.status === 'Returned') && allSigned && (
        <button onClick={onSubmit} style={{ width: '100%', padding: '10px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Submit for Approval</button>
      )}

      {/* Pending approval action */}
      {canApprove && pendingStep && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, border: `2px solid ${HBC_COLORS.orange}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: HBC_COLORS.orange, marginBottom: 8 }}>Action Required: {pendingStep.approverRole}</div>
          <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="Comment (optional)..." style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: 8, fontSize: 12, minHeight: 40, resize: 'vertical', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onApprovalResponse(pendingStep.id, true, approvalComment); setApprovalComment(''); }} style={{ flex: 1, padding: '8px', backgroundColor: HBC_COLORS.success, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Approve</button>
            <button onClick={() => { onApprovalResponse(pendingStep.id, false, approvalComment); setApprovalComment(''); }} style={{ flex: 1, padding: '8px', backgroundColor: HBC_COLORS.error, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Return</button>
          </div>
        </div>
      )}

      {/* Approval chain history */}
      {pmp.approvalCycles.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: HBC_COLORS.gray500 }}>Approval History</h4>
          {pmp.approvalCycles.slice().reverse().map((cycle: IPMPApprovalCycle) => (
            <div key={cycle.cycleNumber} style={{ marginBottom: 12, padding: 10, backgroundColor: HBC_COLORS.gray50, borderRadius: 6, fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Cycle {cycle.cycleNumber} — {cycle.status}</div>
              <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginBottom: 6 }}>Submitted: {new Date(cycle.submittedDate).toLocaleDateString()}</div>
              {cycle.steps.map(step => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STEP_COLORS[step.status] }} />
                  <span style={{ fontSize: 11 }}>{step.approverRole}: {step.approverName}</span>
                  <span style={{ fontSize: 10, color: STEP_COLORS[step.status], fontWeight: 600 }}>{step.status}</span>
                  {step.comment && <span style={{ fontSize: 10, color: HBC_COLORS.gray400, fontStyle: 'italic' }}>— {step.comment}</span>}
                </div>
              ))}
              {cycle.changesFromPrevious.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 10, color: HBC_COLORS.gray400 }}>Changes: {cycle.changesFromPrevious.join('; ')}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
