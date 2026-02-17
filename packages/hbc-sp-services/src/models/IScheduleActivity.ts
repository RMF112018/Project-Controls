export type ActivityStatus = 'Completed' | 'In Progress' | 'Not Started';
export type ScheduleImportFormat = 'P6-CSV' | 'MSProject-CSV';
export type RelationshipType = 'FS' | 'FF' | 'SS' | 'SF';

export interface IScheduleRelationship {
  taskCode: string;
  relationshipType: RelationshipType;
  lag: number;
}

export interface IScheduleActivity {
  id: number;
  projectCode: string;
  importId?: number;
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
  notes: string;
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
}
