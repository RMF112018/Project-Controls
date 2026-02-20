import * as React from 'react';
import { useLocation } from '@router';
import { useProjectSelection } from '../../hooks/useProjectSelection';
import { useLeads } from '../../hooks/useLeads';
import { useWorkflow } from '../../hooks/useWorkflow';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { RoleGate } from '../../guards/RoleGate';
import { ILead, RoleName, Stage, ContractStatus, buildBreadcrumbs, formatCurrency } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 8, padding: 24,
  boxShadow: ELEVATION.level1, marginBottom: 24,
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6,
  border: `1px solid ${HBC_COLORS.gray300}`, boxSizing: 'border-box' as const, outline: 'none',
};

const CONTRACT_STEPS: ContractStatus[] = ['Draft', 'In Review', 'Executed'];

export const ContractTracking: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const { contractInfo, fetchContractInfo, saveContractInfo, transitionStage } = useWorkflow();
  const [project, setProject] = React.useState<ILead | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [contractStatus, setContractStatus] = React.useState<ContractStatus>('Draft');
  const [contractType, setContractType] = React.useState('');
  const [contractValue, setContractValue] = React.useState('');
  const [insurance, setInsurance] = React.useState('');
  const [bond, setBond] = React.useState('');
  const [executionDate, setExecutionDate] = React.useState('');
  const [noticeToProceed, setNoticeToProceed] = React.useState('');
  const [substantialCompletion, setSubstantialCompletion] = React.useState('');
  const [finalCompletion, setFinalCompletion] = React.useState('');

  const { projectCode: activeProjectCode } = useProjectSelection();
  const projectCode = activeProjectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
  }, [leads, projectCode]);
  React.useEffect(() => {
    if (projectCode) fetchContractInfo(projectCode).catch(console.error);
  }, [projectCode, fetchContractInfo]);
  React.useEffect(() => {
    if (contractInfo) {
      setContractStatus(contractInfo.contractStatus);
      setContractType(contractInfo.contractType ?? '');
      setContractValue(contractInfo.contractValue ? String(contractInfo.contractValue) : '');
      setInsurance(contractInfo.insuranceRequirements ?? '');
      setBond(contractInfo.bondRequirements ?? '');
      setExecutionDate(contractInfo.executionDate ?? '');
      setNoticeToProceed(contractInfo.noticeToProceed ?? '');
      setSubstantialCompletion(contractInfo.substantialCompletion ?? '');
      setFinalCompletion(contractInfo.finalCompletion ?? '');
    }
  }, [contractInfo]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } return undefined; }, [toast]);

  const handleSave = async (): Promise<void> => {
    if (!project) return;
    setSaving(true);
    try {
      await saveContractInfo({
        leadId: project.id, projectCode, contractStatus, contractType: contractType || undefined,
        contractValue: contractValue ? parseFloat(contractValue) : undefined,
        insuranceRequirements: insurance || undefined, bondRequirements: bond || undefined,
        executionDate: executionDate || undefined, noticeToProceed: noticeToProceed || undefined,
        substantialCompletion: substantialCompletion || undefined, finalCompletion: finalCompletion || undefined,
      });
      setToast('Contract information saved.');
    } catch { setToast('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleExecute = async (): Promise<void> => {
    if (!project) return;
    setSaving(true);
    try {
      setContractStatus('Executed');
      setExecutionDate(new Date().toISOString().split('T')[0]);
      await saveContractInfo({
        leadId: project.id, projectCode, contractStatus: 'Executed',
        executionDate: new Date().toISOString().split('T')[0],
        contractType: contractType || undefined,
        contractValue: contractValue ? parseFloat(contractValue) : undefined,
        insuranceRequirements: insurance || undefined, bondRequirements: bond || undefined,
        noticeToProceed: noticeToProceed || undefined,
        substantialCompletion: substantialCompletion || undefined, finalCompletion: finalCompletion || undefined,
      });
      await transitionStage(project, Stage.ActiveConstruction);
      setToast('Contract executed. Stage transitioned to Active Construction.');
    } catch (err) { setToast(err instanceof Error ? err.message : 'Failed to execute contract.'); }
    finally { setSaving(false); }
  };

  if (leadsLoading) return <SkeletonLoader variant="form" rows={6} />;
  if (!project) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}><h2>Project not found</h2></div>;

  const currentStepIdx = CONTRACT_STEPS.indexOf(contractStatus);

  return (
    <div>
      <PageHeader title="Contract Tracking" subtitle={`${project.Title} — ${project.ClientName}`} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
      {toast && <div style={{ padding: '12px 16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{toast}</div>}

      {/* Contract Status Stepper */}
      <div style={{ ...cardStyle }}>
        <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Contract Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          {CONTRACT_STEPS.map((step, idx) => {
            const isPast = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const color = isCurrent ? HBC_COLORS.orange : isPast ? HBC_COLORS.success : HBC_COLORS.gray200;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                    {isPast ? '\u2713' : idx + 1}
                  </div>
                  <span style={{ fontSize: 12, color: isCurrent ? HBC_COLORS.navy : HBC_COLORS.gray500, fontWeight: isCurrent ? 700 : 400, marginTop: 4 }}>{step}</span>
                </div>
                {idx < CONTRACT_STEPS.length - 1 && <div style={{ flex: 1, height: 3, backgroundColor: isPast ? HBC_COLORS.success : HBC_COLORS.gray200, borderRadius: 2, marginBottom: 20 }} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <RoleGate allowedRoles={[RoleName.Legal]} fallback={
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Contract Details (Read Only)</h3>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Status: {contractStatus}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Type: {contractType || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Value: {contractValue ? formatCurrency(parseFloat(contractValue)) : '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Execution Date: {executionDate || '-'}</p>
          <p style={{ fontSize: 14, color: HBC_COLORS.gray600, marginBottom: 8 }}>Notice to Proceed: {noticeToProceed || '-'}</p>
        </div>
      }>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Contract Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Contract Status</label>
              <select value={contractStatus} onChange={e => setContractStatus(e.target.value as ContractStatus)} style={inputStyle}>
                {CONTRACT_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Contract Type</label><input value={contractType} onChange={e => setContractType(e.target.value)} placeholder="GMP, Lump Sum, etc." style={inputStyle} /></div>
            <div><label style={labelStyle}>Contract Value ($)</label><input type="number" value={contractValue} onChange={e => setContractValue(e.target.value)} placeholder="0" style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Insurance Requirements</label><textarea value={insurance} onChange={e => setInsurance(e.target.value)} placeholder="Insurance requirements..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }} /></div>
          <div style={{ marginBottom: 16 }}><label style={labelStyle}>Bond Requirements</label><textarea value={bond} onChange={e => setBond(e.target.value)} placeholder="Bond requirements..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }} /></div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Key Contract Dates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={labelStyle}>Execution Date</label><input type="date" value={executionDate} onChange={e => setExecutionDate(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Notice to Proceed</label><input type="date" value={noticeToProceed} onChange={e => setNoticeToProceed(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Substantial Completion</label><input type="date" value={substantialCompletion} onChange={e => setSubstantialCompletion(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Final Completion</label><input type="date" value={finalCompletion} onChange={e => setFinalCompletion(e.target.value)} style={inputStyle} /></div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy }}>Documents</h3>
          <div style={{ border: `2px dashed ${HBC_COLORS.gray300}`, borderRadius: 8, padding: 24, textAlign: 'center', color: HBC_COLORS.gray500, fontSize: 14 }}>
            Contract documents stored in 00_Project_Admin/Contracts
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : 'Save'}</button>
          {contractStatus !== 'Executed' && (
            <button onClick={handleExecute} disabled={saving} style={{ padding: '10px 24px', backgroundColor: HBC_COLORS.success, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14 }}>Mark Contract Executed</button>
          )}
        </div>
      </RoleGate>
    </div>
  );
};
