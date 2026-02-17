import * as React from 'react';
import { HBC_COLORS } from '../../../theme/tokens';
import { IScheduleActivity, IScheduleImport, ScheduleImportFormat, parseScheduleFile } from '@hbc/sp-services';

interface ScheduleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (activities: IScheduleActivity[], meta: Partial<IScheduleImport>) => Promise<void>;
  projectCode: string;
}

export const ScheduleImportModal: React.FC<ScheduleImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  projectCode,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<ScheduleImportFormat>('P6-CSV');
  const [parsed, setParsed] = React.useState<IScheduleActivity[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setFormat('P6-CSV');
      setParsed([]);
      setParseError(null);
      setNotes('');
    }
  }, [isOpen]);

  const detectFormat = React.useCallback((fileName: string): ScheduleImportFormat => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xer') return 'P6-XER';
    if (ext === 'xml') return 'MSProject-XML';
    return 'P6-CSV';
  }, []);

  const parseFile = React.useCallback(async (f: File, fmt: ScheduleImportFormat) => {
    setParseError(null);
    try {
      const text = await f.text();
      const activities = parseScheduleFile(text, fmt, projectCode);
      if (activities.length === 0) {
        setParseError(`No activities found. Check the file format matches "${fmt}".`);
        setParsed([]);
      } else {
        setParsed(activities);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsed([]);
    }
  }, [projectCode]);

  const handleFileSelect = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const detected = detectFormat(f.name);
    setFormat(detected);
    await parseFile(f, detected);
  }, [detectFormat, parseFile]);

  const handleFormatChange = React.useCallback(async (newFormat: ScheduleImportFormat) => {
    setFormat(newFormat);
    if (file) {
      await parseFile(file, newFormat);
    }
  }, [file, parseFile]);

  const handleImport = React.useCallback(async () => {
    if (parsed.length === 0 || !file) return;
    setImporting(true);
    try {
      await onImport(parsed, {
        fileName: file.name,
        format,
        notes,
      });
      onClose();
    } catch {
      // error handled in parent
    } finally {
      setImporting(false);
    }
  }, [parsed, file, format, notes, onImport, onClose]);

  // Summary stats from parsed data
  const summary = React.useMemo(() => {
    if (parsed.length === 0) return null;
    const completed = parsed.filter(a => a.status === 'Completed').length;
    const inProgress = parsed.filter(a => a.status === 'In Progress').length;
    const notStarted = parsed.filter(a => a.status === 'Not Started').length;
    const critical = parsed.filter(a => a.isCritical).length;
    const dates = parsed
      .map(a => a.plannedStartDate || a.actualStartDate)
      .filter(Boolean)
      .sort() as string[];
    const endDates = parsed
      .map(a => a.plannedFinishDate || a.actualFinishDate)
      .filter(Boolean)
      .sort() as string[];
    return {
      total: parsed.length,
      completed,
      inProgress,
      notStarted,
      critical,
      earliestStart: dates[0] || null,
      latestFinish: endDates[endDates.length - 1] || null,
    };
  }, [parsed]);

  if (!isOpen) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: HBC_COLORS.navy }}>Import Schedule</h3>
          <button onClick={onClose} style={closeBtn}>&times;</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select File</label>
            <input type="file" accept=".csv,.xer,.xml" onChange={handleFileSelect} style={{ fontSize: 13 }} />
          </div>
          <div style={{ width: 180 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Format</label>
            <select
              value={format}
              onChange={e => handleFormatChange(e.target.value as ScheduleImportFormat)}
              style={{ width: '100%', padding: '6px 8px', fontSize: 13, borderRadius: 6, border: '1px solid #D1D5DB' }}
            >
              <option value="P6-CSV">P6 CSV</option>
              <option value="P6-XER">P6 XER</option>
              <option value="MSProject-XML">MSProject XML</option>
              <option value="MSProject-CSV">MSProject CSV</option>
            </select>
          </div>
        </div>

        {parseError && (
          <div style={{ padding: '8px 12px', backgroundColor: HBC_COLORS.errorLight, color: '#991B1B', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
            {parseError}
          </div>
        )}

        {summary && (
          <div style={{ padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: HBC_COLORS.navy }}>Parse Preview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <StatBox label="Total" value={summary.total} color={HBC_COLORS.navy} />
              <StatBox label="Completed" value={summary.completed} color={HBC_COLORS.success} />
              <StatBox label="In Progress" value={summary.inProgress} color={HBC_COLORS.warning} />
              <StatBox label="Critical" value={summary.critical} color={HBC_COLORS.error} />
            </div>
            {summary.earliestStart && summary.latestFinish && (
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                Date range: {new Date(summary.earliestStart).toLocaleDateString()} &ndash; {new Date(summary.latestFinish).toLocaleDateString()}
              </div>
            )}

            {/* First 5 rows preview */}
            <div style={{ marginTop: 12, fontSize: 12, color: '#475569' }}>
              <strong>First 5 activities:</strong>
              <table style={{ width: '100%', marginTop: 4, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={previewTh}>ID</th>
                    <th style={previewTh}>Name</th>
                    <th style={previewTh}>Status</th>
                    <th style={previewTh}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 5).map(a => (
                    <tr key={a.taskCode}>
                      <td style={previewTd}>{a.taskCode}</td>
                      <td style={previewTd}>{a.activityName}</td>
                      <td style={previewTd}>{a.status}</td>
                      <td style={previewTd}>{a.originalDuration}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ width: '100%', minHeight: 60, fontSize: 13, padding: 8, borderRadius: 6, border: '1px solid #D1D5DB', resize: 'vertical' }}
            placeholder="Import notes..."
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleImport}
            disabled={parsed.length === 0 || importing}
            style={{ ...importBtn, opacity: parsed.length === 0 || importing ? 0.5 : 1 }}
          >
            {importing ? 'Importing...' : `Import ${parsed.length} Activities`}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: 'white', borderRadius: 6, border: '1px solid #E2E8F0' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 11, color: '#64748B' }}>{label}</div>
  </div>
);

// Styles
const overlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const modal: React.CSSProperties = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  width: 560, maxHeight: '80vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8', padding: '0 4px',
};

const cancelBtn: React.CSSProperties = {
  padding: '8px 16px', fontSize: 13, borderRadius: 6, border: '1px solid #D1D5DB',
  backgroundColor: 'white', cursor: 'pointer',
};

const importBtn: React.CSSProperties = {
  padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none',
  backgroundColor: HBC_COLORS.navy, color: 'white', cursor: 'pointer',
};

const previewTh: React.CSSProperties = {
  textAlign: 'left', padding: '3px 6px', borderBottom: '1px solid #E2E8F0', fontWeight: 600,
};

const previewTd: React.CSSProperties = {
  padding: '3px 6px', borderBottom: '1px solid #F1F5F9',
};
