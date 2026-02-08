import * as React from 'react';
import { IBuyoutEntry, CompassPreQualStatus } from '../../../models/IBuyoutEntry';
import { evaluateCommitmentRisk } from '../../../utils/riskEngine';
import { HBC_COLORS } from '../../../theme/tokens';

export interface ICommitmentFormProps {
  entry: IBuyoutEntry;
  onSubmit: (data: Partial<IBuyoutEntry>) => void;
  onCancel: () => void;
}

const COMPASS_OPTIONS: CompassPreQualStatus[] = ['Approved', 'Pending', 'Expired', 'Not Registered'];

const sectionStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: 16,
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: 8,
  backgroundColor: HBC_COLORS.gray50,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: HBC_COLORS.gray700,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: 13,
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: 4,
  boxSizing: 'border-box',
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 0',
};

export const CommitmentForm: React.FC<ICommitmentFormProps> = ({ entry, onSubmit, onCancel }) => {
  const [qScore, setQScore] = React.useState<number | undefined>(entry.qScore);
  const [compassStatus, setCompassStatus] = React.useState<CompassPreQualStatus | undefined>(entry.compassPreQualStatus);
  const [scopeMatch, setScopeMatch] = React.useState(entry.scopeMatchesBudget ?? false);
  const [exhibitC, setExhibitC] = React.useState(entry.exhibitCInsuranceConfirmed ?? false);
  const [exhibitD, setExhibitD] = React.useState(entry.exhibitDScheduleConfirmed ?? false);
  const [exhibitE, setExhibitE] = React.useState(entry.exhibitESafetyConfirmed ?? false);
  const [pdfUrl, setPdfUrl] = React.useState(entry.compiledCommitmentPdfUrl ?? '');
  const [errors, setErrors] = React.useState<string[]>([]);

  // Live risk assessment
  const riskAssessment = React.useMemo(() => {
    return evaluateCommitmentRisk({ ...entry, qScore });
  }, [entry, qScore]);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (qScore == null || qScore < 0 || qScore > 100) errs.push('Q-Score must be between 0 and 100');
    if (!compassStatus) errs.push('Compass Pre-Qual status is required');
    if (!scopeMatch) errs.push('Scope must match budget confirmation is required');
    if (!exhibitC) errs.push('Exhibit C (Insurance) confirmation is required');
    if (!exhibitD) errs.push('Exhibit D (Schedule) confirmation is required');
    if (!exhibitE) errs.push('Exhibit E (Safety) confirmation is required');
    if (!pdfUrl.trim()) errs.push('Compiled Commitment PDF is required');
    return errs;
  };

  const handleSubmit = (): void => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onSubmit({
      qScore,
      compassPreQualStatus: compassStatus,
      scopeMatchesBudget: scopeMatch,
      exhibitCInsuranceConfirmed: exhibitC,
      exhibitDScheduleConfirmed: exhibitD,
      exhibitESafetyConfirmed: exhibitE,
      compiledCommitmentPdfUrl: pdfUrl,
    });
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy }}>
        Commitment Submission: {entry.divisionDescription}
      </h3>

      {/* Risk Assessment Banner */}
      {riskAssessment.triggers.length > 0 && (
        <div style={{
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          backgroundColor: riskAssessment.requiresWaiver ? HBC_COLORS.warningLight : HBC_COLORS.infoLight,
          border: `1px solid ${riskAssessment.requiresWaiver ? HBC_COLORS.warning : HBC_COLORS.info}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: riskAssessment.requiresWaiver ? '#92400E' : '#1E40AF', marginBottom: 4 }}>
            {riskAssessment.requiresWaiver ? 'Waiver Required' : 'Risk Advisory'}
          </div>
          {riskAssessment.triggers.map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: HBC_COLORS.gray700, paddingLeft: 8 }}>- {t}</div>
          ))}
        </div>
      )}

      {/* Risk Profile */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 12 }}>Risk Profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Q-Score (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={qScore ?? ''}
              onChange={e => setQScore(e.target.value ? Number(e.target.value) : undefined)}
              style={inputStyle}
              placeholder="Enter Q-Score"
            />
          </div>
          <div>
            <label style={labelStyle}>Compass Pre-Qual Status</label>
            <select
              value={compassStatus ?? ''}
              onChange={e => setCompassStatus(e.target.value as CompassPreQualStatus || undefined)}
              style={inputStyle}
            >
              <option value="">Select...</option>
              {COMPASS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        {riskAssessment.qScoreWarning && (
          <div style={{ fontSize: 11, color: HBC_COLORS.warning, marginTop: 6, fontWeight: 600 }}>
            Warning: Q-Score below 70 threshold
          </div>
        )}
      </div>

      {/* Compliance Checklist */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 12 }}>Compliance Checklist</div>
        <div style={checkboxRowStyle}>
          <input type="checkbox" checked={scopeMatch} onChange={e => setScopeMatch(e.target.checked)} id="scope" />
          <label htmlFor="scope" style={{ fontSize: 13 }}>Scope matches Budget</label>
        </div>
        <div style={checkboxRowStyle}>
          <input type="checkbox" checked={exhibitC} onChange={e => setExhibitC(e.target.checked)} id="exhibitC" />
          <label htmlFor="exhibitC" style={{ fontSize: 13 }}>Exhibit C (Insurance) confirmed in PDF</label>
        </div>
        <div style={checkboxRowStyle}>
          <input type="checkbox" checked={exhibitD} onChange={e => setExhibitD(e.target.checked)} id="exhibitD" />
          <label htmlFor="exhibitD" style={{ fontSize: 13 }}>Exhibit D (Schedule) confirmed in PDF</label>
        </div>
        <div style={checkboxRowStyle}>
          <input type="checkbox" checked={exhibitE} onChange={e => setExhibitE(e.target.checked)} id="exhibitE" />
          <label htmlFor="exhibitE" style={{ fontSize: 13 }}>Exhibit E (Safety) confirmed in PDF</label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <div style={checkboxRowStyle}>
            <input type="checkbox" checked={entry.enrolledInSDI} disabled id="sdi" />
            <label htmlFor="sdi" style={{ fontSize: 13, color: HBC_COLORS.gray500 }}>SDI Enrolled</label>
          </div>
          <div style={checkboxRowStyle}>
            <input type="checkbox" checked={entry.bondRequired} disabled id="bond" />
            <label htmlFor="bond" style={{ fontSize: 13, color: HBC_COLORS.gray500 }}>Bond Required</label>
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 12 }}>Compiled Commitment Document</div>
        <label style={labelStyle}>PDF URL or File Reference</label>
        <input
          type="text"
          value={pdfUrl}
          onChange={e => setPdfUrl(e.target.value)}
          style={inputStyle}
          placeholder="Enter document URL or path"
        />
        <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginTop: 4 }}>
          Upload the compiled commitment PDF to the project site and paste the URL here.
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div style={{
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          backgroundColor: HBC_COLORS.errorLight,
          border: `1px solid ${HBC_COLORS.error}`,
        }}>
          {errors.map((err, i) => (
            <div key={i} style={{ fontSize: 12, color: '#991B1B' }}>- {err}</div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: `1px solid ${HBC_COLORS.gray300}`,
            backgroundColor: '#fff',
            color: HBC_COLORS.gray700,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: 'none',
            backgroundColor: HBC_COLORS.navy,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Submit for Approval
        </button>
      </div>
    </div>
  );
};
