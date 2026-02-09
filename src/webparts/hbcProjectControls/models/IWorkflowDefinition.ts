import { WorkflowKey, StepAssignmentType, ConditionField } from './enums';

export interface IWorkflowDefinition {
  id: number;
  workflowKey: WorkflowKey;
  name: string;
  description: string;
  steps: IWorkflowStep[];
  isActive: boolean;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface IWorkflowStep {
  id: number;
  workflowId: number;
  stepOrder: number;
  name: string;
  description?: string;
  assignmentType: StepAssignmentType;
  projectRole?: string;
  defaultAssignee?: IPersonAssignment;
  conditionalAssignees: IConditionalAssignment[];
  isConditional: boolean;
  conditionDescription?: string;
  actionLabel: string;
  canChairMeeting?: boolean;
}

export interface IPersonAssignment {
  userId: string;
  displayName: string;
  email: string;
}

export interface IConditionalAssignment {
  id: number;
  stepId: number;
  conditions: IAssignmentCondition[];
  assignee: IPersonAssignment;
  priority: number;
}

export interface IAssignmentCondition {
  field: ConditionField;
  operator: 'equals';
  value: string;
}

export interface IWorkflowStepOverride {
  id: number;
  projectCode: string;
  workflowKey: WorkflowKey;
  stepId: number;
  overrideAssignee: IPersonAssignment;
  overrideReason?: string;
  overriddenBy: string;
  overriddenDate: string;
}

export interface IResolvedWorkflowStep {
  stepId: number;
  stepOrder: number;
  name: string;
  assignee: IPersonAssignment;
  assignmentSource: 'ProjectRole' | 'Condition' | 'Default' | 'Override';
  isConditional: boolean;
  conditionMet: boolean;
  actionLabel: string;
  canChairMeeting: boolean;
}
