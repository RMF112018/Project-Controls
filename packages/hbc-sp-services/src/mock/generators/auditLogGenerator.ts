import type { IAuditEntry } from '../../models/IAuditEntry';
import { AuditAction, EntityType } from '../../models/enums';
import { SeededRandom, randomDate, USER_EMAILS } from './helpers';

/** Weighted audit actions — common actions appear more frequently. */
const WEIGHTED_ACTIONS: readonly { action: AuditAction; weight: number }[] = [
  { action: AuditAction.LeadCreated, weight: 8 },
  { action: AuditAction.LeadEdited, weight: 12 },
  { action: AuditAction.GoNoGoScoreSubmitted, weight: 5 },
  { action: AuditAction.GoNoGoDecisionMade, weight: 3 },
  { action: AuditAction.ScorecardSubmitted, weight: 6 },
  { action: AuditAction.EstimateCreated, weight: 4 },
  { action: AuditAction.EstimateStatusChanged, weight: 7 },
  { action: AuditAction.PermissionChanged, weight: 3 },
  { action: AuditAction.ConfigFeatureFlagChanged, weight: 2 },
  { action: AuditAction.ScheduleUpdated, weight: 6 },
  { action: AuditAction.ScheduleActivitiesImported, weight: 2 },
  { action: AuditAction.ConstraintUpdated, weight: 4 },
  { action: AuditAction.MonthlyReviewSubmitted, weight: 3 },
  { action: AuditAction.PMPSubmitted, weight: 2 },
  { action: AuditAction.PMPApproved, weight: 2 },
  { action: AuditAction.SiteProvisioningTriggered, weight: 1 },
  { action: AuditAction.SiteProvisioningCompleted, weight: 1 },
  { action: AuditAction.WorkflowStepUpdated, weight: 5 },
  { action: AuditAction.ChecklistItemUpdated, weight: 8 },
  { action: AuditAction.ProjectRecordUpdated, weight: 6 },
  { action: AuditAction.RiskItemUpdated, weight: 3 },
  { action: AuditAction.QualityConcernUpdated, weight: 2 },
  { action: AuditAction.SafetyConcernUpdated, weight: 2 },
  { action: AuditAction.PerformanceLogRecorded, weight: 4 },
  { action: AuditAction.Dashboard_Loaded, weight: 10 },
];

/** Map actions to likely entity types. */
const ACTION_ENTITY_MAP: Partial<Record<AuditAction, EntityType>> = {
  [AuditAction.LeadCreated]: EntityType.Lead,
  [AuditAction.LeadEdited]: EntityType.Lead,
  [AuditAction.GoNoGoScoreSubmitted]: EntityType.Scorecard,
  [AuditAction.GoNoGoDecisionMade]: EntityType.Scorecard,
  [AuditAction.ScorecardSubmitted]: EntityType.Scorecard,
  [AuditAction.EstimateCreated]: EntityType.Estimate,
  [AuditAction.EstimateStatusChanged]: EntityType.Estimate,
  [AuditAction.PermissionChanged]: EntityType.Permission,
  [AuditAction.ConfigFeatureFlagChanged]: EntityType.Config,
  [AuditAction.ScheduleUpdated]: EntityType.Schedule,
  [AuditAction.ScheduleActivitiesImported]: EntityType.ScheduleActivity,
  [AuditAction.ConstraintUpdated]: EntityType.Constraint,
  [AuditAction.MonthlyReviewSubmitted]: EntityType.MonthlyReview,
  [AuditAction.PMPSubmitted]: EntityType.PMP,
  [AuditAction.PMPApproved]: EntityType.PMP,
  [AuditAction.SiteProvisioningTriggered]: EntityType.Project,
  [AuditAction.SiteProvisioningCompleted]: EntityType.Project,
  [AuditAction.WorkflowStepUpdated]: EntityType.WorkflowDefinition,
  [AuditAction.ChecklistItemUpdated]: EntityType.Checklist,
  [AuditAction.ProjectRecordUpdated]: EntityType.ProjectRecord,
  [AuditAction.RiskItemUpdated]: EntityType.RiskCost,
  [AuditAction.QualityConcernUpdated]: EntityType.Quality,
  [AuditAction.SafetyConcernUpdated]: EntityType.Safety,
  [AuditAction.PerformanceLogRecorded]: EntityType.Performance,
  [AuditAction.Dashboard_Loaded]: EntityType.Dashboard,
};

function pickWeightedAction(rng: SeededRandom): AuditAction {
  const totalWeight = WEIGHTED_ACTIONS.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng.float(0, totalWeight);
  for (const item of WEIGHTED_ACTIONS) {
    roll -= item.weight;
    if (roll <= 0) return item.action;
  }
  return WEIGHTED_ACTIONS[0].action;
}

/**
 * Generate `count` realistic audit log entries.
 * Timestamps distributed over the last 90 days for realistic volume.
 */
export function generateAuditEntries(count: number, seed: number = 42): IAuditEntry[] {
  const rng = new SeededRandom(seed);
  const entries: IAuditEntry[] = [];
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const action = pickWeightedAction(rng);
    const entityType = ACTION_ENTITY_MAP[action] || EntityType.Project;
    const timestamp = new Date(now - rng.next() * ninetyDaysMs).toISOString();

    entries.push({
      id: i + 1,
      Timestamp: timestamp,
      User: rng.choice(USER_EMAILS),
      UserId: rng.int(1, 20),
      Action: action,
      EntityType: entityType,
      EntityId: String(rng.int(1, 500)),
      ProjectCode: rng.bool(0.7) ? `25-${rng.int(1, 99).toString().padStart(3, '0')}-01` : undefined,
      Details: `${action} performed on ${entityType} #${rng.int(1, 500)}`,
    });
  }

  // Sort by timestamp descending (newest first)
  entries.sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

  return entries;
}
