import * as React from 'react';
import { IBuyoutEntry, CompassPreQualStatus, EVerifyStatus } from '../../../models/IBuyoutEntry';
import { evaluateCommitmentRisk } from '../../../utils/riskEngine';
import { HBC_COLORS } from '../../../theme/tokens';

export interface ICommitmentFormProps {
  entry: IBuyoutEntry;
  onSubmit: (data: Partial<IBuyoutEntry>, file?: File) => void;
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

const EVERIFY_STATUS_COLORS: Record<EVerifyStatus, { bg: string; color: string }> = {
  'Not Sent': { bg: HBC_COLORS.gray200, color: HBC_COLORS.gray700 },
  'Sent': { bg: HBC_COLORS.infoLight, color: '#1E40AF' },
  'Reminder Sent': { bg: HBC_COLORS.warningLight, color: '#92400E' },
  'Received': { bg: HBC_COLORS.successLight, color: '#065F46' },
  'Overdue': { bg: HBC_COLORS.errorLight, color: '#991B1B' },
};

function computeEVerifyStatus(sent?: string, reminder?: string, received?: string): EVerifyStatus {
  if (received) return 'Received';
  if (sent) {
    const sentDate = new Date(sent);
    const now = new Date();
    const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceSent > 30) return 'Overdue';
    if (reminder) return 'Reminder Sent';
    return 'Sent';
  }
  return 'Not Sent';
}

export const CommitmentForm: React.FC<ICommitmentFormProps> = ({ entry, onSubmit, onCancel }) => {
  const [qScore, setQScore] = React.useState<number | undefined>(entry.qScore);
  const [compassStatus, setCompassStatus] = React.useState<CompassPreQualStatus | undefined>(entry.compassPreQualStatus);
  const [scopeMatch, setScopeMatch] = React.useState(entry.scopeMatchesBudget ?? false);
  const [exhibitC, setExhibitC] = React.useState(entry.exhibitCInsuranceConfirmed ?? false);
  const [exhibitD, setExhibitD] = React.useState(entry.exhibitDScheduleConfirmed ?? false);
  const [exhibitE, setExhibitE] = React.useState(entry.exhibitESafetyConfirmed ?? false);
  const [errors, setErrors] = React.useState<string[]>([]);

  // File upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [existingFileName] = React.useState(entry.compiledCommitmentFileName ?? '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // E-Verify state
  const [eVerifyContractNumber, setEVerifyContractNumber] = React.useState(entry.eVerifyContractNumber ?? '');
  const [eVerifySentDate, setEVerifySentDate] = React.useState(entry.eVerifySentDate ?? '');
  const [eVerifyReminderDate, setEVerifyReminderDate] = React.useState(entry.eVerifyReminderDate ?? '');
  const [eVerifyReceivedDate, setEVerifyReceivedDate] = React.useState(entry.eVerifyReceivedDate ?? '');

  // Computed E-Verify status
  const eVerifyStatus = React.useMemo(
    () => computeEVerifyStatus(eVerifySentDate, eVerifyReminderDate, eVerifyReceivedDate),
    [eVerifySentDate, eVerifyReminderDate, eVerifyReceivedDate]
  );

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
    if (!selectedFile && !existingFileName) errs.push('Compiled Commitment PDF is required');
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
      eVerifyContractNumber,
      eVerifySentDate: eVerifySentDate || undefined,
      eVerifyReminderDate: eVerifyReminderDate || undefined,
      eVerifyReceivedDate: eVerifyReceivedDate || undefined,
      eVerifyStatus,
    }, selectedFile ?? undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors(prev => [...prev, 'Only PDF files are accepted']);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrors(prev => [...prev, 'File size must be less than 25MB']);
        return;
      }
      setSelectedFile(file);
    }
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

      {/* E-Verify Compliance */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy }}>E-Verify Affidavit Tracking</div>
          <span style={{
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: EVERIFY_STATUS_COLORS[eVerifyStatus].bg,
            color: EVERIFY_STATUS_COLORS[eVerifyStatus].color,
          }}>
            {eVerifyStatus}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Contract Number</label>
            <input
              type="text"
              value={eVerifyContractNumber}
              onChange={e => setEVerifyContractNumber(e.target.value)}
              style={inputStyle}
              placeholder="e.g., SC-25-042-01-05-120"
            />
          </div>
          <div>
            <label style={labelStyle}>E-Verify Sent Date</label>
            <input
              type="date"
              value={eVerifySentDate}
              onChange={e => setEVerifySentDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Reminder Sent Date</label>
            <input
              type="date"
              value={eVerifyReminderDate}
              onChange={e => setEVerifyReminderDate(e.target.value)}
              style={inputStyle}
              disabled={!eVerifySentDate}
            />
          </div>
          <div>
            <label style={labelStyle}>E-Verify Received Date</label>
            <input
              type="date"
              value={eVerifyReceivedDate}
              onChange={e => setEVerifyReceivedDate(e.target.value)}
              style={inputStyle}
              disabled={!eVerifySentDate}
            />
          </div>
        </div>
        {eVerifyStatus === 'Overdue' && (
          <div style={{ fontSize: 11, color: HBC_COLORS.error, marginTop: 8, fontWeight: 600 }}>
            E-Verify affidavit is overdue. More than 30 days since sent without receipt.
          </div>
        )}
      </div>

      {/* Document Upload */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 12 }}>Compiled Commitment Document</div>

        {existingFileName && !selectedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: HBC_COLORS.successLight,
            borderRadius: 6,
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 16 }}>&#128196;</span>
            <span style={{ fontSize: 12, color: '#065F46', flex: 1 }}>{existingFileName}</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                border: `1px solid ${HBC_COLORS.gray300}`,
                borderRadius: 4,
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: HBC_COLORS.gray700,
              }}
            >
              Replace
            </button>
          </div>
        )}

        {selectedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: HBC_COLORS.infoLight,
            borderRadius: 6,
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 16 }}>&#128196;</span>
            <span style={{ fontSize: 12, color: '#1E40AF', flex: 1 }}>
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
            <button
              type="button"
              onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                border: `1px solid ${HBC_COLORS.error}`,
                borderRadius: 4,
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: HBC_COLORS.error,
              }}
            >
              Remove
            </button>
          </div>
        )}

        {!existingFileName && !selectedFile && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${HBC_COLORS.gray300}`,
              borderRadius: 8,
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#fff',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = HBC_COLORS.info)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = HBC_COLORS.gray300)}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>&#128194;</div>
            <div style={{ fontSize: 12, color: HBC_COLORS.gray600, fontWeight: 600 }}>
              Click to upload compiled commitment PDF
            </div>
            <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginTop: 2 }}>
              PDF files only, max 25MB
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
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
