import * as React from 'react';
import { IWorkflowStep, IConditionalAssignment } from '../../models/IWorkflowDefinition';
import { StepAssignmentType, RoleName, ConditionField } from '../../models/enums';
import { AzureADPeoplePicker } from './AzureADPeoplePicker';
import { ConditionBuilder } from './ConditionBuilder';
import { HBC_COLORS } from '../../theme/tokens';

interface IWorkflowStepCardProps {
  step: IWorkflowStep;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStep: (data: Partial<IWorkflowStep>) => void;
  onAddCondition: (assignment: Partial<IConditionalAssignment>) => void;
  onUpdateCondition: (assignmentId: number, data: IConditionalAssignment) => void;
  onRemoveCondition: (assignmentId: number) => void;
  disabled?: boolean;
}

export const WorkflowStepCard: React.FC<IWorkflowStepCardProps> = ({
  step,
  isExpanded,
  onToggle,
  onUpdateStep,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  disabled = false,
}) => {
  const isProjectRole = step.assignmentType === StepAssignmentType.ProjectRole;
  const badgeColor = isProjectRole ? HBC_COLORS.info : HBC_COLORS.orange;
  const badgeBg = isProjectRole ? HBC_COLORS.infoLight : '#FEF3C7';

  return (
    <div style={{
      border: `1px solid ${isExpanded ? HBC_COLORS.navy : HBC_COLORS.gray200}`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Collapsed header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: isExpanded ? HBC_COLORS.gray50 : '#fff',
        }}
      >
        {/* Step order circle */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: HBC_COLORS.navy,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {step.stepOrder}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
              {step.name}
            </span>
            {/* Assignment type badge */}
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 600,
              color: badgeColor,
              backgroundColor: badgeBg,
            }}>
              {step.assignmentType}
            </span>
            {step.isConditional && (
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                color: HBC_COLORS.warning,
                backgroundColor: HBC_COLORS.warningLight,
              }}>
                Conditional
              </span>
            )}
            {step.featureFlagName && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#6B21A8',
                backgroundColor: '#F3E8FF',
              }}>
                &#9873; {step.featureFlagName}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '2px' }}>
            {isProjectRole
              ? step.projectRole || '(No role assigned)'
              : step.defaultAssignee?.displayName || '(No default assignee)'}
          </div>
        </div>

        <span style={{ color: HBC_COLORS.gray400, fontSize: '18px', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          &#9660;
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '16px', borderTop: `1px solid ${HBC_COLORS.gray200}` }}>
          {step.description && (
            <div style={{ fontSize: '13px', color: HBC_COLORS.gray600, marginBottom: '16px' }}>
              {step.description}
            </div>
          )}

          {/* Action Label */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
              Action Label
            </label>
            <input
              value={step.actionLabel}
              onChange={e => onUpdateStep({ actionLabel: e.target.value })}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: `1px solid ${HBC_COLORS.gray300}`,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {isProjectRole ? (
            /* ProjectRole mode */
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: '4px' }}>
                Project Role
              </label>
              <select
                value={step.projectRole || ''}
                onChange={e => onUpdateStep({ projectRole: e.target.value })}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${HBC_COLORS.gray300}`,
                  fontSize: '13px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">Select role...</option>
                {Object.values(RoleName).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '6px', fontStyle: 'italic' }}>
                Resolved dynamically from the project team at execution time.
              </div>
            </div>
          ) : (
            /* NamedPerson mode */
            <div>
              <div style={{ marginBottom: '12px' }}>
                <AzureADPeoplePicker
                  label="Default Assignee"
                  selectedUser={step.defaultAssignee || null}
                  onSelect={user => onUpdateStep({ defaultAssignee: user || undefined })}
                  disabled={disabled}
                />
              </div>

              {/* Can Chair Meeting */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: disabled ? 'default' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={step.canChairMeeting || false}
                  onChange={e => onUpdateStep({ canChairMeeting: e.target.checked })}
                  disabled={disabled}
                />
                <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>Can chair meeting</span>
              </label>

              {/* Conditional Assignments */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600 }}>
                    Conditional Assignments ({step.conditionalAssignees.length})
                  </span>
                  {!disabled && (
                    <button
                      onClick={() => onAddCondition({
                        stepId: step.id,
                        conditions: [{ field: ConditionField.Division, operator: 'equals', value: '' }],
                        assignee: { userId: '', displayName: '', email: '' },
                        priority: step.conditionalAssignees.length + 1,
                      })}
                      style={{
                        background: 'none',
                        border: `1px solid ${HBC_COLORS.info}`,
                        color: HBC_COLORS.info,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '4px 10px',
                        borderRadius: '4px',
                      }}
                    >
                      + Add Condition
                    </button>
                  )}
                </div>

                {step.conditionalAssignees.length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '12px', backgroundColor: HBC_COLORS.gray50, borderRadius: '6px' }}>
                    No conditional assignments. Default assignee will always be used.
                  </div>
                )}

                {step.conditionalAssignees.map(ca => (
                  <ConditionBuilder
                    key={ca.id}
                    assignment={ca}
                    onChange={updated => onUpdateCondition(ca.id, updated)}
                    onRemove={() => onRemoveCondition(ca.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conditional info banner */}
          {step.isConditional && step.conditionDescription && (
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: HBC_COLORS.warningLight,
              border: `1px solid ${HBC_COLORS.warning}`,
              fontSize: '12px',
              color: '#92400E',
            }}>
              {step.conditionDescription}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
