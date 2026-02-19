import * as React from 'react';
import {
  AuditAction,
  EntityType,
  IQualityRemediationSuggestion,
  IScheduleActivity,
  IScheduleQualityReport,
  PERMISSIONS,
  ScheduleEngine,
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { ExportButtons } from '../../shared/ExportButtons';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

interface IScheduleQualityWorkbenchProps {
  projectCode: string;
  activities: IScheduleActivity[];
  onFieldReadinessRefresh: () => void;
}

function applySuggestionPatches(
  activities: IScheduleActivity[],
  suggestions: IQualityRemediationSuggestion[],
): IScheduleActivity[] {
  const next = activities.map(a => ({ ...a }));
  const byKey = new Map(next.map(a => [a.externalActivityKey as string, a]));
  suggestions.forEach((suggestion) => {
    suggestion.activityPatches.forEach((patch) => {
      const row = byKey.get(patch.externalActivityKey);
      if (!row) return;
      Object.assign(row, patch.patch);
    });
  });
  return next;
}

export const ScheduleQualityWorkbench: React.FC<IScheduleQualityWorkbenchProps> = ({
  projectCode,
  activities,
  onFieldReadinessRefresh,
}) => {
  const { dataService, currentUser, hasPermission } = useAppContext();
  const { addToast } = useToast();
  const engineRef = React.useRef(new ScheduleEngine());
  const proceedRef = React.useRef<HTMLButtonElement | null>(null);
  const [report, setReport] = React.useState<IScheduleQualityReport | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [baselineFieldReadinessScore, setBaselineFieldReadinessScore] = React.useState<number | null>(null);
  const [projectedFieldReadinessScore, setProjectedFieldReadinessScore] = React.useState<number | null>(null);
  const [readinessAssumptions, setReadinessAssumptions] = React.useState<string>('Using latest linkage, constraints, and permits snapshot.');
  const [isApplying, setIsApplying] = React.useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = React.useState(false);
  const [assertiveLive, setAssertiveLive] = React.useState('');
  const [politeLive, setPoliteLive] = React.useState('');
  const canApply = hasPermission(PERMISSIONS.SCHEDULE_EDIT);

  const loadReport = React.useCallback(async () => {
    try {
      const next = await dataService.runScheduleQualityChecks(projectCode, activities);
      setReport(next);
      setSelectedIds([]);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to run quality checks', 'error');
    }
  }, [activities, addToast, dataService, projectCode]);

  const refreshBaselineFieldReadiness = React.useCallback(async () => {
    try {
      const baseline = await dataService.computeFieldReadinessScore(projectCode);
      setBaselineFieldReadinessScore(baseline.score);
    } catch {
      setBaselineFieldReadinessScore(null);
    }
  }, [dataService, projectCode]);

  React.useEffect(() => {
    if (!projectCode) return;
    void loadReport();
    void refreshBaselineFieldReadiness();
  }, [loadReport, projectCode, refreshBaselineFieldReadiness]);

  const selectedSuggestions = React.useMemo(() => {
    if (!report) return [];
    const selectedSet = new Set(selectedIds);
    return report.remediationSuggestions.filter(s => selectedSet.has(s.id));
  }, [report, selectedIds]);

  const previewActivities = React.useMemo(() => applySuggestionPatches(activities, selectedSuggestions), [activities, selectedSuggestions]);

  const baselineCpm = React.useMemo(() => {
    try {
      return engineRef.current.runCpm(projectCode, activities);
    } catch {
      return null;
    }
  }, [activities, projectCode]);

  const projectedCpmResult = React.useMemo(() => {
    try {
      return {
        result: engineRef.current.runCpm(projectCode, previewActivities),
        error: null as string | null,
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Projected CPM failed',
      };
    }
  }, [previewActivities, projectCode]);

  const projectedCpmSummary = React.useMemo(() => {
    if (!baselineCpm || !projectedCpmResult.result) return null;
    const baselineFloat = baselineCpm.activities.reduce((sum, row) => sum + row.totalFloatDays, 0);
    const projectedFloat = projectedCpmResult.result.activities.reduce((sum, row) => sum + row.totalFloatDays, 0);
    const floatImprovement = Math.round((projectedFloat - baselineFloat) * 10) / 10;
    return {
      baselineDuration: baselineCpm.projectDurationDays,
      projectedDuration: projectedCpmResult.result.projectDurationDays,
      floatImprovement,
    };
  }, [baselineCpm, projectedCpmResult.result]);

  React.useEffect(() => {
    const loadProjection = async (): Promise<void> => {
      if (selectedSuggestions.length === 0) {
        setProjectedFieldReadinessScore(baselineFieldReadinessScore);
        return;
      }
      try {
        const [links, constraints, permits] = await Promise.all([
          dataService.getScheduleFieldLinks(projectCode),
          dataService.getConstraints(projectCode),
          dataService.getPermits(projectCode),
        ]);
        const projected = engineRef.current.computeFieldReadinessScore(projectCode, previewActivities, links, constraints, permits);
        setProjectedFieldReadinessScore(projected.score);
      } catch {
        setProjectedFieldReadinessScore(null);
        setReadinessAssumptions('Field readiness projection unavailable: dependent data snapshot retrieval failed.');
      }
    };
    void loadProjection();
  }, [baselineFieldReadinessScore, dataService, previewActivities, projectCode, selectedSuggestions.length]);

  const impactedActivityKeys = React.useMemo(() => {
    const keys = new Set<string>();
    selectedSuggestions.forEach(s => s.activityPatches.forEach(p => keys.add(p.externalActivityKey)));
    return Array.from(keys);
  }, [selectedSuggestions]);

  const applyRemediation = React.useCallback(async () => {
    if (!canApply) return;
    if (!report) return;
    if (selectedSuggestions.length === 0) return;
    if (projectedCpmResult.error) {
      setAssertiveLive('Apply blocked: projected CPM validation failed.');
      addToast('Apply blocked due to projected CPM validation failure.', 'error');
      return;
    }
    setIsApplying(true);
    try {
      const rowByKey = new Map(activities.map(a => [a.externalActivityKey as string, a]));
      const mergedPatch = new Map<string, Partial<IScheduleActivity>>();
      selectedSuggestions.forEach((suggestion) => {
        suggestion.activityPatches.forEach((patch) => {
          mergedPatch.set(patch.externalActivityKey, {
            ...(mergedPatch.get(patch.externalActivityKey) || {}),
            ...patch.patch,
          });
        });
      });
      for (const [externalActivityKey, patch] of mergedPatch.entries()) {
        const row = rowByKey.get(externalActivityKey);
        if (!row) continue;
        await dataService.updateScheduleActivity(projectCode, row.id, patch);
      }

      await dataService.logAudit({
        Action: AuditAction.ScheduleUpdated,
        EntityType: EntityType.Schedule,
        EntityId: projectCode,
        ProjectCode: projectCode,
        User: currentUser?.email ?? 'unknown',
        Details: `Quality remediation applied: ${selectedSuggestions.map(s => s.id).join(', ')}; impacted=${impactedActivityKeys.length}; readinessDelta=${baselineFieldReadinessScore !== null && projectedFieldReadinessScore !== null ? (Math.round((projectedFieldReadinessScore - baselineFieldReadinessScore) * 10) / 10).toFixed(1) : 'n/a'}`,
      });

      setPoliteLive(`Applied remediation updates to ${impactedActivityKeys.length} activities.`);
      addToast(`Applied remediation updates to ${impactedActivityKeys.length} activities.`, 'success');
      onFieldReadinessRefresh();
      await refreshBaselineFieldReadiness();
      await loadReport();
    } catch (error) {
      setAssertiveLive('Remediation apply failed.');
      addToast(error instanceof Error ? error.message : 'Remediation apply failed', 'error');
    } finally {
      setIsApplying(false);
      setShowBulkConfirm(false);
    }
  }, [
    canApply,
    report,
    selectedSuggestions,
    projectedCpmResult.error,
    dataService,
    projectCode,
    currentUser?.email,
    impactedActivityKeys.length,
    baselineFieldReadinessScore,
    projectedFieldReadinessScore,
    onFieldReadinessRefresh,
    refreshBaselineFieldReadiness,
    loadReport,
    activities,
    addToast,
  ]);

  const handleApplyClick = React.useCallback(() => {
    if (!canApply) return;
    if (impactedActivityKeys.length > 10) {
      setShowBulkConfirm(true);
      return;
    }
    void applyRemediation();
  }, [applyRemediation, canApply, impactedActivityKeys.length]);

  React.useEffect(() => {
    if (!showBulkConfirm) return;
    proceedRef.current?.focus();
  }, [showBulkConfirm]);

  if (!report) {
    return <div style={{ ...cardStyle, color: HBC_COLORS.gray600 }}>Running quality checks...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div aria-live="polite" style={srOnly}>{politeLive}</div>
      <div aria-live="assertive" style={srOnly}>{assertiveLive}</div>

      <div id={`schedule-quality-workbench-${projectCode}`} style={cardStyle}>
        <div style={headerRow}>
          <div>
            <div style={titleStyle}>Schedule Quality Workbench</div>
            <div style={subtitleStyle}>DCMA 14-point checks with custom weighted quality grading and remediation wizard.</div>
          </div>
          <ExportButtons
            pdfElementId={`schedule-quality-workbench-${projectCode}`}
            data={report.exportRows as unknown as Record<string, unknown>[]}
            filename={`${projectCode}-schedule-quality`}
            title="Schedule Quality Report"
          />
        </div>

        <div style={scoreGrid}>
          <MetricCard label="Overall Score" value={report.overallScore.toFixed(1)} />
          <MetricCard label="DCMA Score" value={report.dcmaScore.toFixed(1)} />
          <MetricCard label="Custom Score" value={report.customRuleScore.toFixed(1)} />
          <MetricCard label="Failures" value={`${report.dcmaChecks.filter(c => !c.passed).length}/${report.dcmaChecks.length}`} />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>DCMA 14 Checks</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Check</th>
              <th style={thStyle}>Result</th>
              <th style={thStyle}>Value</th>
              <th style={thStyle}>Threshold</th>
              <th style={thStyle}>Weight</th>
              <th style={thStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {report.dcmaChecks.map(check => (
              <tr key={check.id}>
                <td style={tdStyle}>{check.id} - {check.name}</td>
                <td style={tdStyle}>{check.passed ? 'Pass' : 'Fail'}</td>
                <td style={tdStyle}>{check.value}</td>
                <td style={tdStyle}>{check.threshold}</td>
                <td style={tdStyle}>{check.weight.toFixed(1)}</td>
                <td style={tdStyle}>{check.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>Remediation Wizard</div>
        {report.remediationSuggestions.length === 0 ? (
          <div style={{ color: HBC_COLORS.gray600 }}>No remediation suggestions were generated.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.remediationSuggestions.map((suggestion) => (
                <label key={suggestion.id} style={suggestionRowStyle}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(suggestion.id)}
                    onChange={() => {
                      setSelectedIds(prev => prev.includes(suggestion.id) ? prev.filter(id => id !== suggestion.id) : [...prev, suggestion.id]);
                    }}
                  />
                  <div style={{ display: 'grid', gap: 2 }}>
                    <div style={{ fontWeight: 600 }}>{suggestion.title}</div>
                    <div style={{ fontSize: 12, color: HBC_COLORS.gray600 }}>{suggestion.description}</div>
                    <div style={{ fontSize: 12, color: HBC_COLORS.navy }}>
                      Impact preview: CP compression {suggestion.estimatedImpact.cpCompressionDays}d, float improvement {suggestion.estimatedImpact.avgFloatImprovementDays}d.
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: 10, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Projected CPM Impact</div>
              {projectedCpmResult.error ? (
                <div style={{ color: HBC_COLORS.error }}>
                  Projection blocked: {projectedCpmResult.error}
                </div>
              ) : projectedCpmSummary ? (
                <div style={{ color: HBC_COLORS.gray700 }}>
                  Projected CPM Impact: Critical path length {projectedCpmSummary.baselineDuration}d → {projectedCpmSummary.projectedDuration}d; total float improvement {projectedCpmSummary.floatImprovement >= 0 ? '+' : ''}{projectedCpmSummary.floatImprovement}d.
                </div>
              ) : (
                <div style={{ color: HBC_COLORS.gray600 }}>Select one or more remediations to preview CPM impact.</div>
              )}
            </div>

            <div style={{ marginTop: 12, padding: 10, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Field Readiness Correlation Insight</div>
              <div style={{ color: HBC_COLORS.gray700 }}>
                Baseline: {baselineFieldReadinessScore !== null ? baselineFieldReadinessScore.toFixed(1) : 'N/A'} | Projected: {projectedFieldReadinessScore !== null ? projectedFieldReadinessScore.toFixed(1) : 'N/A'} | Delta: {baselineFieldReadinessScore !== null && projectedFieldReadinessScore !== null ? (projectedFieldReadinessScore - baselineFieldReadinessScore).toFixed(1) : 'N/A'}
              </div>
              <div style={{ fontSize: 12, color: HBC_COLORS.gray600, marginTop: 4 }}>{readinessAssumptions}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                style={btnPrimary}
                disabled={!canApply || isApplying || selectedSuggestions.length === 0 || !!projectedCpmResult.error}
                onClick={handleApplyClick}
                aria-disabled={!canApply || isApplying || selectedSuggestions.length === 0 || !!projectedCpmResult.error}
              >
                {isApplying ? 'Applying...' : `Apply Selected (${impactedActivityKeys.length} activities)`}
              </button>
              {!canApply && (
                <span style={{ fontSize: 12, color: HBC_COLORS.gray600, alignSelf: 'center' }}>
                  Apply requires schedule edit permission.
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {showBulkConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="bulk-apply-title"
          style={dialogOverlay}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setShowBulkConfirm(false);
            }
          }}
        >
          <div style={dialogCard}>
            <h3 id="bulk-apply-title" style={{ margin: 0, color: HBC_COLORS.navy }}>
              Bulk update of {impactedActivityKeys.length} activities - proceed?
            </h3>
            <p style={{ margin: '8px 0 12px 0', color: HBC_COLORS.gray700 }}>
              This remediation set updates more than 10 activities. Confirm before applying.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button ref={proceedRef} type="button" style={btnPrimary} onClick={() => void applyRemediation()}>
                Proceed
              </button>
              <button type="button" style={btnSecondary} onClick={() => setShowBulkConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: 8,
  boxShadow: ELEVATION.level1,
  padding: 14,
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  color: HBC_COLORS.navy,
  fontSize: 16,
};

const subtitleStyle: React.CSSProperties = {
  color: HBC_COLORS.gray600,
  fontSize: 12,
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  color: HBC_COLORS.navy,
  marginBottom: 10,
};

const scoreGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
  gap: 8,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: `1px solid ${HBC_COLORS.gray200}`,
  padding: '8px 6px',
  color: HBC_COLORS.gray600,
};

const tdStyle: React.CSSProperties = {
  borderBottom: `1px solid ${HBC_COLORS.gray100}`,
  padding: '8px 6px',
  verticalAlign: 'top',
  color: HBC_COLORS.gray700,
};

const suggestionRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '16px 1fr',
  alignItems: 'start',
  gap: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: 6,
  padding: 8,
};

const metricCardStyle: React.CSSProperties = {
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: 6,
  padding: 8,
};

const btnPrimary: React.CSSProperties = {
  background: HBC_COLORS.navy,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: '#fff',
  color: HBC_COLORS.navy,
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const dialogOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const dialogCard: React.CSSProperties = {
  width: 480,
  maxWidth: '92vw',
  background: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 16,
};

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  border: 0,
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={metricCardStyle}>
    <div style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>{label}</div>
    <div style={{ fontSize: 18, color: HBC_COLORS.navy, fontWeight: 700 }}>{value}</div>
  </div>
);
