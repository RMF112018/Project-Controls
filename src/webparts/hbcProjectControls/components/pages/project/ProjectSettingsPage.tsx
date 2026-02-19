import * as React from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { StatusBadge } from '../../shared/StatusBadge';
import { AzureADPeoplePicker } from '../../shared/AzureADPeoplePicker';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import {
  IResolvedWorkflowStep,
  IWorkflowStepOverride,
  IPersonAssignment,
  WorkflowKey,
  PERMISSIONS,
  buildBreadcrumbs,
  ContractTrackingStep,
} from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

const STEP_LABELS: Record<ContractTrackingStep, string> = {
  APM_PA: 'APM / PA',
  ProjectManager: 'Project Manager',
  RiskManager: 'Risk Manager',
  ProjectExecutive: 'Project Executive',
};

const STEP_ORDER: ContractTrackingStep[] = ['APM_PA', 'ProjectManager', 'RiskManager', 'ProjectExecutive'];

type SourceType = 'Override' | 'ProjectRole' | 'Default';

function getSourceBadge(source: SourceType): React.ReactNode {
  const map: Record<SourceType, { label: string; color: string; bg: string }> = {
    Override: { label: 'Override', color: '#fff', bg: HBC_COLORS.warning },
    ProjectRole: { label: 'Project Role', color: '#fff', bg: HBC_COLORS.success },
    Default: { label: 'Default', color: '#fff', bg: HBC_COLORS.gray400 },
  };
  const cfg = map[source];
  return <StatusBadge label={cfg.label} color={cfg.color} backgroundColor={cfg.bg} />;
}

export const ProjectSettingsPage: React.FC = () => {
  const { dataService, selectedProject, hasPermission, currentUser } = useAppContext();
  const location = useLocation();
  const projectCode = selectedProject?.projectCode ?? '';

  const [resolvedSteps, setResolvedSteps] = React.useState<IResolvedWorkflowStep[]>([]);
  const [overrides, setOverrides] = React.useState<IWorkflowStepOverride[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<number | null>(null); // stepOrder being saved

  const canEdit = hasPermission(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PX)
    || hasPermission(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PM);

  const loadData = React.useCallback(async () => {
    if (!projectCode) return;
    setLoading(true);
    try {
      const [chain, allOverrides] = await Promise.all([
        dataService.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode),
        dataService.getWorkflowOverrides(projectCode),
      ]);
      setResolvedSteps(chain);
      setOverrides(allOverrides.filter(o => o.workflowKey === WorkflowKey.CONTRACT_TRACKING));
    } catch {
      // silent — empty state will show
    } finally {
      setLoading(false);
    }
  }, [dataService, projectCode]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleSetOverride = React.useCallback(async (
    step: ContractTrackingStep,
    person: IPersonAssignment
  ) => {
    const stepIndex = STEP_ORDER.indexOf(step);
    const resolved = resolvedSteps.find(s => s.stepOrder === stepIndex + 1);
    if (!resolved) return;

    setSaving(stepIndex + 1);
    try {
      await dataService.setWorkflowStepOverride({
        projectCode,
        workflowKey: WorkflowKey.CONTRACT_TRACKING,
        stepId: resolved.stepId,
        overrideAssignee: person,
        overriddenBy: currentUser?.email ?? 'unknown',
        overriddenDate: new Date().toISOString(),
      });
      await loadData();
    } catch {
      // silent
    } finally {
      setSaving(null);
    }
  }, [dataService, projectCode, currentUser, resolvedSteps, loadData]);

  const handleRemoveOverride = React.useCallback(async (overrideId: number) => {
    setSaving(-1);
    try {
      await dataService.removeWorkflowStepOverride(overrideId);
      await loadData();
    } catch {
      // silent
    } finally {
      setSaving(null);
    }
  }, [dataService, loadData]);

  const breadcrumbs = buildBreadcrumbs(location.pathname, selectedProject?.projectName);

  return (
    <div>
      <PageHeader
        title="Project Settings"
        subtitle="Configure project-specific workflow recipients"
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
      />

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: ELEVATION.level1,
        border: `1px solid ${HBC_COLORS.gray200}`,
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>
          Contract Tracking Recipients
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: HBC_COLORS.gray500 }}>
          Configure who receives each approval step in the contract tracking workflow.
          Changes apply to new submissions only.
        </p>

        {loading ? (
          <SkeletonLoader variant="table" rows={4} columns={4} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {STEP_ORDER.map((step, i) => {
              const stepOrder = i + 1;
              const resolved = resolvedSteps.find(s => s.stepOrder === stepOrder);
              const override = overrides.find(o => o.stepId === resolved?.stepId);
              const assignee = resolved?.assignee;
              const source: SourceType = resolved?.assignmentSource === 'Override'
                ? 'Override'
                : resolved?.assignmentSource === 'Default'
                  ? 'Default'
                  : 'ProjectRole';
              const isSaving = saving === stepOrder || saving === -1;

              return (
                <div
                  key={step}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: canEdit ? '180px 1fr auto 240px auto' : '180px 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: HBC_COLORS.gray50,
                    border: `1px solid ${HBC_COLORS.gray200}`,
                    opacity: isSaving ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {/* Step label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: HBC_COLORS.navy,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {stepOrder}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy }}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>

                  {/* Current assignee */}
                  <div style={{ minWidth: 0 }}>
                    {assignee?.email ? (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.navy }}>
                          {assignee.displayName}
                        </div>
                        <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>
                          {assignee.email}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: HBC_COLORS.gray400, fontStyle: 'italic' }}>
                        No assignee
                      </span>
                    )}
                  </div>

                  {/* Source badge */}
                  <div>{getSourceBadge(source)}</div>

                  {/* People picker (edit mode only) */}
                  {canEdit && (
                    <div>
                      <AzureADPeoplePicker
                        selectedUser={null}
                        onSelect={(user) => {
                          if (user) handleSetOverride(step, user);
                        }}
                        placeholder="Change assignee..."
                        disabled={isSaving}
                      />
                    </div>
                  )}

                  {/* Reset button (edit mode + override exists) */}
                  {canEdit && (
                    <div>
                      {override ? (
                        <button
                          onClick={() => handleRemoveOverride(override.id)}
                          disabled={isSaving}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '4px',
                            border: `1px solid ${HBC_COLORS.gray300}`,
                            backgroundColor: '#fff',
                            color: HBC_COLORS.gray600,
                            cursor: isSaving ? 'default' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Reset
                        </button>
                      ) : (
                        <div style={{ width: '52px' }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
