import * as React from 'react';
import { IConditionalAssignment, IAssignmentCondition } from '../../models/IWorkflowDefinition';
import { ConditionField, Region, Division, Sector } from '../../models/enums';
import { AzureADPeoplePicker } from './AzureADPeoplePicker';
import { HBC_COLORS } from '../../theme/tokens';

interface IConditionBuilderProps {
  assignment: IConditionalAssignment;
  onChange: (updated: IConditionalAssignment) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const FIELD_VALUES: Record<ConditionField, string[]> = {
  [ConditionField.Division]: Object.values(Division),
  [ConditionField.Region]: Object.values(Region),
  [ConditionField.Sector]: Object.values(Sector),
};

const selectStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: '4px',
  border: `1px solid ${HBC_COLORS.gray300}`,
  fontSize: '12px',
  backgroundColor: '#fff',
  minWidth: '120px',
};

export const ConditionBuilder: React.FC<IConditionBuilderProps> = ({
  assignment,
  onChange,
  onRemove,
  disabled = false,
}) => {
  const handleConditionChange = (index: number, field: keyof IAssignmentCondition, value: string): void => {
    const updatedConditions = [...assignment.conditions];
    if (field === 'field') {
      updatedConditions[index] = { ...updatedConditions[index], field: value as ConditionField, value: '' };
    } else if (field === 'value') {
      updatedConditions[index] = { ...updatedConditions[index], value };
    }
    onChange({ ...assignment, conditions: updatedConditions });
  };

  const handleAddCondition = (): void => {
    onChange({
      ...assignment,
      conditions: [...assignment.conditions, { field: ConditionField.Division, operator: 'equals', value: '' }],
    });
  };

  const handleRemoveCondition = (index: number): void => {
    const updatedConditions = assignment.conditions.filter((_, i) => i !== index);
    onChange({ ...assignment, conditions: updatedConditions });
  };

  return (
    <div style={{
      padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${HBC_COLORS.gray200}`,
      backgroundColor: HBC_COLORS.gray50,
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray600 }}>
          Priority {assignment.priority}
        </span>
        {!disabled && (
          <button
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              color: HBC_COLORS.error,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Conditions */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          When
        </span>
        {assignment.conditions.map((cond, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            {idx > 0 && <span style={{ fontSize: '11px', color: HBC_COLORS.gray400, fontWeight: 600 }}>AND</span>}
            <select
              value={cond.field}
              onChange={e => handleConditionChange(idx, 'field', e.target.value)}
              disabled={disabled}
              style={selectStyle}
            >
              {Object.values(ConditionField).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>equals</span>
            <select
              value={cond.value}
              onChange={e => handleConditionChange(idx, 'value', e.target.value)}
              disabled={disabled}
              style={selectStyle}
            >
              <option value="">Select...</option>
              {FIELD_VALUES[cond.field]?.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {!disabled && assignment.conditions.length > 1 && (
              <button
                onClick={() => handleRemoveCondition(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: HBC_COLORS.gray400,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            onClick={handleAddCondition}
            style={{
              background: 'none',
              border: 'none',
              color: HBC_COLORS.info,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              marginTop: '6px',
              padding: 0,
            }}
          >
            + Add condition
          </button>
        )}
      </div>

      {/* Assignee */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
          Then assign to
        </span>
        <AzureADPeoplePicker
          selectedUser={assignment.assignee}
          onSelect={user => { if (user) onChange({ ...assignment, assignee: user }); }}
          disabled={disabled}
        />
      </div>

      {/* Priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Priority
        </span>
        <input
          type="number"
          min={1}
          value={assignment.priority}
          onChange={e => onChange({ ...assignment, priority: parseInt(e.target.value) || 1 })}
          disabled={disabled}
          style={{
            width: '50px',
            padding: '4px 6px',
            borderRadius: '4px',
            border: `1px solid ${HBC_COLORS.gray300}`,
            fontSize: '12px',
            textAlign: 'center',
          }}
        />
      </div>
    </div>
  );
};
