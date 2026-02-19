export type ActivityStatus = 'Completed' | 'In Progress' | 'Not Started';
export type ScheduleImportFormat = 'P6-CSV' | 'P6-XER' | 'MSProject-XML' | 'MSProject-CSV';
export type RelationshipType = 'FS' | 'FF' | 'SS' | 'SF';
export type ScheduleLineageStatus = 'linked' | 'auto-matched' | 'manual-remap' | 'orphaned' | 'unmatched';
export type ScheduleConflictType = 'update_conflict' | 'delete_conflict' | 'link_orphaned' | 'identity_ambiguous';

export interface IScheduleRelationship {
  taskCode: string;
  relationshipType: RelationshipType;
  lag: number;
}

export interface IScheduleActivity {
  id: number;
  projectCode: string;
  importId?: number;
  externalActivityKey?: string;
  importFingerprint?: string;
  lineageStatus?: ScheduleLineageStatus;
  taskCode: string;
  wbsCode: string;
  activityName: string;
  activityType: string;
  status: ActivityStatus;
  // Duration (days)
  originalDuration: number;
  remainingDuration: number;
  actualDuration: number;
  // Dates — Baseline
  baselineStartDate: string | null;
  baselineFinishDate: string | null;
  // Dates — Planned
  plannedStartDate: string | null;
  plannedFinishDate: string | null;
  // Dates — Actual
  actualStartDate: string | null;
  actualFinishDate: string | null;
  // Float (days)
  remainingFloat: number | null;
  freeFloat: number | null;
  // Relationships
  predecessors: string[];
  successors: string[];
  successorDetails: IScheduleRelationship[];
  // Resources & Calendar
  resources: string;
  calendarName: string;
  // Constraints
  primaryConstraint: string;
  secondaryConstraint: string;
  // Derived / computed
  isCritical: boolean;
  percentComplete: number;
  startVarianceDays: number | null;
  finishVarianceDays: number | null;
  // Metadata
  deleteFlag: boolean;
  createdDate: string;
  modifiedDate: string;
}

export interface IScheduleImport {
  id: number;
  projectCode: string;
  fileName: string;
  format: ScheduleImportFormat;
  importDate: string;
  importedBy: string;
  activityCount: number;
  matchedCount?: number;
  ambiguousCount?: number;
  newCount?: number;
  orphanedFieldLinkCount?: number;
  notes: string;
}

export interface IScheduleFieldLink {
  id: number;
  projectCode: string;
  externalActivityKey: string;
  scheduleActivityId?: number;
  fieldTaskId: string;
  fieldTaskType: string;
  confidenceScore: number;
  isManual: boolean;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
}

export interface IScheduleReconcilePreviewItem {
  incomingExternalActivityKey?: string;
  incomingTaskCode: string;
  incomingActivityName: string;
  confidenceScore: number;
  reason: string;
  existingActivityId?: number;
  existingExternalActivityKey?: string;
  action: 'matched' | 'ambiguous' | 'new' | 'orphaned';
}

export interface IScheduleImportReconciliationResult {
  projectCode: string;
  importId: number;
  matchedCount: number;
  ambiguousCount: number;
  newCount: number;
  orphanedFieldLinkCount: number;
  previewItems: IScheduleReconcilePreviewItem[];
}

export interface IScheduleConflict {
  id: string;
  projectCode: string;
  type: ScheduleConflictType;
  externalActivityKey?: string;
  scheduleActivityId?: number;
  fieldTaskId?: string;
  detectedAt: string;
  detectedBy: string;
  details: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export interface IScheduleMetrics {
  totalActivities: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  percentComplete: number;
  criticalActivityCount: number;
  negativeFloatCount: number;
  averageFloat: number;
  spiApproximation: number | null;
  floatDistribution: {
    negative: number;
    zero: number;
    low: number;
    medium: number;
    high: number;
  };
  negativeFloatPercent: number;
  cpiApproximation: number | null;
  constraintAnalysis: {
    totalConstrained: number;
    byType: Record<string, number>;
  };
  earnedValueMetrics: {
    plannedDuration: number;
    earnedDuration: number;
    actualDuration: number;
    bac: number;
    ev: number;
    pv: number;
    sv: number;
    spi: number | null;
    cpi: number | null;
  };
  logicMetrics: {
    totalRelationships: number;
    avgPredecessors: number;
    avgSuccessors: number;
    openEnds: { noSuccessor: number; noPredecessor: number };
    relationshipTypes: Record<string, number>;
  };
}
