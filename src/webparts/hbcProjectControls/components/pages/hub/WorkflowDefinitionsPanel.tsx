import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkflowDefinitions } from '../../hooks/useWorkflowDefinitions';
import { WorkflowStepCard } from '../../shared/WorkflowStepCard';
import { WorkflowPreview } from '../../shared/WorkflowPreview';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import {
  IWorkflowDefinition,
  IWorkflowStep,
  IConditionalAssignment,
} from '../../../models/IWorkflowDefinition';
import { AuditAction, EntityType, WorkflowKey } from '../../../models/enums';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';
import { formatDateTime } from '../../../utils/formatters';

const WORKFLOW_LABELS: Record<string, string> = {
  [WorkflowKey.GO_NO_GO]: 'Go/No-Go',
  [WorkflowKey.PMP_APPROVAL]: 'PMP Approval',
  [WorkflowKey.MONTHLY_REVIEW]: 'Monthly Review',
  [WorkflowKey.COMMITMENT_APPROVAL]: 'Commitment',
};

export const WorkflowDefinitionsPanel: React.FC = () => {
  const { dataService, currentUser } = useAppContext();
  const {
    workflows,
    loading,
    fetchDefinitions,
    updateStep,
    addCondition,
    updateCondition,
    removeCondition,
  } = useWorkflowDefinitions();

  const [selectedWorkflowId, setSelectedWorkflowId] = React.useState<number | null>(null);
  const [expandedStepId, setExpandedStepId] = React.useState<number | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    fetchDefinitions().catch(console.error);
  }, [fetchDefinitions]);

  // Auto-select first workflow
  React.useEffect(() => {
    if (workflows.length > 0 && selectedWorkflowId === null) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows, selectedWorkflowId]);

  const selectedWorkflow = React.useMemo(
    () => workflows.find(w => w.id === selectedWorkflowId) || null,
    [workflows, selectedWorkflowId]
  );

  const logAudit = (action: AuditAction, details: string): void => {
    dataService.logAudit({
      Action: action,
      EntityType: EntityType.WorkflowDefinition,
      EntityId: String(selectedWorkflowId),
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: details,
    }).catch(console.error);
  };

  const handleUpdateStep = async (workflowId: number, stepId: number, data: Partial<IWorkflowStep>): Promise<void> => {
    try {
      await updateStep(workflowId, stepId, data);
      logAudit(AuditAction.WorkflowStepUpdated, `Updated step ${stepId} in workflow ${workflowId}`);
    } catch (err) {
      console.error('Failed to update step:', err);
    }
  };

  const handleAddCondition = async (stepId: number, assignment: Partial<IConditionalAssignment>): Promise<void> => {
    try {
      await addCondition(stepId, assignment);
      logAudit(AuditAction.WorkflowConditionAdded, `Added condition to step ${stepId}`);
    } catch (err) {
      console.error('Failed to add condition:', err);
    }
  };

  const handleUpdateCondition = async (assignmentId: number, data: IConditionalAssignment): Promise<void> => {
    try {
      await updateCondition(assignmentId, data);
    } catch (err) {
      console.error('Failed to update condition:', err);
    }
  };

  const handleRemoveCondition = async (assignmentId: number): Promise<void> => {
    try {
      await removeCondition(assignmentId);
      logAudit(AuditAction.WorkflowConditionRemoved, `Removed condition ${assignmentId}`);
    } catch (err) {
      console.error('Failed to remove condition:', err);
    }
  };

  if (loading && workflows.length === 0) {
    return <SkeletonLoader variant="card" />;
  }

  return (
    <div style={{ display: 'flex', gap: SPACING.lg, minHeight: '400px' }}>
      {/* Left panel: Workflow list */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Workflows ({workflows.length})
        </div>
        {workflows.map((wf: IWorkflowDefinition) => {
          const isSelected = wf.id === selectedWorkflowId;
          return (
            <div
              key={wf.id}
              onClick={() => { setSelectedWorkflowId(wf.id); setExpandedStepId(null); }}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
                backgroundColor: isSelected ? HBC_COLORS.gray50 : '#fff',
                border: `1px solid ${isSelected ? HBC_COLORS.navy : HBC_COLORS.gray200}`,
                borderLeft: isSelected ? `4px solid ${HBC_COLORS.navy}` : `4px solid transparent`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = HBC_COLORS.gray50; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
                {WORKFLOW_LABELS[wf.workflowKey] || wf.name}
              </div>
              <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '4px' }}>
                {wf.steps.length} step{wf.steps.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '4px' }}>
                Modified {formatDateTime(wf.lastModifiedDate)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel: Selected workflow detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedWorkflow ? (
          <>
            {/* Workflow header */}
            <div style={{ marginBottom: SPACING.lg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>
                    {selectedWorkflow.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: HBC_COLORS.gray500, margin: '4px 0 0 0' }}>
                    {selectedWorkflow.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: selectedWorkflow.isActive ? '#065F46' : HBC_COLORS.gray500,
                    backgroundColor: selectedWorkflow.isActive ? HBC_COLORS.successLight : HBC_COLORS.gray100,
                  }}>
                    {selectedWorkflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => setShowPreview(true)}
                  >
                    Preview Resolution
                  </Button>
                </div>
              </div>
            </div>

            {/* Step chain */}
            <div>
              {selectedWorkflow.steps
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <WorkflowStepCard
                      step={step}
                      isExpanded={expandedStepId === step.id}
                      onToggle={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                      onUpdateStep={data => {
                        handleUpdateStep(selectedWorkflow.id, step.id, data).catch(console.error);
                      }}
                      onAddCondition={assignment => {
                        handleAddCondition(step.id, assignment).catch(console.error);
                      }}
                      onUpdateCondition={(assignmentId, data) => {
                        handleUpdateCondition(assignmentId, data).catch(console.error);
                      }}
                      onRemoveCondition={assignmentId => {
                        handleRemoveCondition(assignmentId).catch(console.error);
                      }}
                    />
                    {idx < selectedWorkflow.steps.length - 1 && (
                      <div style={{ textAlign: 'center', padding: '6px 0', color: HBC_COLORS.gray300, fontSize: '18px' }}>
                        &#8595;
                      </div>
                    )}
                  </React.Fragment>
                ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray400 }}>
            Select a workflow from the left panel.
          </div>
        )}
      </div>

      {/* Preview modal */}
      {showPreview && selectedWorkflow && (
        <WorkflowPreview
          workflowKey={selectedWorkflow.workflowKey as WorkflowKey}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
