import { IBuyoutEntry } from '../models/IBuyoutEntry';
import { IRiskAssessment, ApprovalStep } from '../models/ICommitmentApproval';

/**
 * Risk thresholds for commitment approval.
 */
export const RISK_THRESHOLDS = {
  BOND_WAIVER_MIN: 50000,
  HIGH_VALUE_ESCALATION: 250000,
  Q_SCORE_WARNING: 70,
} as const;

/**
 * Evaluate commitment risk for a buyout entry.
 * Determines whether a compliance waiver is needed and the escalation level.
 *
 * Rules:
 * - Contract >= $50,000 AND Bond = No  → waiver required (PX authority)
 * - Contract >= $250,000 AND (SDI = No OR Bond = No) → waiver + Compliance Manager escalation
 * - Q-Score < 70 → warning flag (non-blocking)
 */
export function evaluateCommitmentRisk(entry: IBuyoutEntry): IRiskAssessment {
  const triggers: string[] = [];
  let requiresWaiver = false;
  let escalationLevel: ApprovalStep = 'PX';

  const value = entry.contractValue ?? 0;

  // Bond waiver trigger: >= $50k without bond
  if (value >= RISK_THRESHOLDS.BOND_WAIVER_MIN && !entry.bondRequired) {
    triggers.push('Bond not required for contract >= $50,000');
    requiresWaiver = true;
  }

  // High-value escalation: >= $250k with any missing compliance
  if (value >= RISK_THRESHOLDS.HIGH_VALUE_ESCALATION) {
    if (!entry.enrolledInSDI || !entry.bondRequired) {
      triggers.push('SDI/Bond compliance gap for contract >= $250,000');
      requiresWaiver = true;
      escalationLevel = 'ComplianceManager';
    }
  }

  const qScoreWarning = (entry.qScore ?? 100) < RISK_THRESHOLDS.Q_SCORE_WARNING;
  if (qScoreWarning) {
    triggers.push(`Q-Score (${entry.qScore ?? 'N/A'}) is below ${RISK_THRESHOLDS.Q_SCORE_WARNING} threshold`);
  }

  return {
    triggers,
    requiresWaiver,
    escalationLevel,
    qScoreWarning,
  };
}

/**
 * Determine the waiver type from a risk assessment and entry data.
 */
export function determineWaiverType(entry: IBuyoutEntry): 'SDI' | 'Bond' | 'Insurance' | 'Multiple' | undefined {
  const missing: string[] = [];
  if (!entry.enrolledInSDI) missing.push('SDI');
  if (!entry.bondRequired) missing.push('Bond');

  if (missing.length === 0) return undefined;
  if (missing.length > 1) return 'Multiple';
  return missing[0] as 'SDI' | 'Bond';
}
