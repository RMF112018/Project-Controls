import type { IBuyoutEntry } from '../../models/IBuyoutEntry';
import type { ICommitmentApproval, CommitmentStatus, ApprovalStep } from '../../models/ICommitmentApproval';
import type { ContractTrackingStatus } from '../../models/IContractTrackingApproval';
import {
  SeededRandom,
  randomDate,
  randomDateOnly,
  randomProjectCode,
  SUBCONTRACTOR_NAMES,
  DIVISION_CODES,
  DIVISION_DESCRIPTIONS,
} from './helpers';

const BUYOUT_STATUSES: readonly IBuyoutEntry['status'][] = ['Not Started', 'In Progress', 'Awarded', 'Executed'];
const COMMITMENT_STATUSES: readonly CommitmentStatus[] = [
  'Budgeted', 'PendingReview', 'WaiverPending', 'PXApproved',
  'ComplianceReview', 'CFOReview', 'Committed', 'Rejected',
];
const CONTRACT_TRACKING_STATUSES: readonly ContractTrackingStatus[] = [
  'NotStarted', 'PendingAPM', 'PendingPM', 'PendingRiskMgr',
  'PendingPX', 'Tracked', 'Rejected',
];

/**
 * Generate `count` realistic buyout entries with deterministic data.
 * Default seed ensures identical output across runs.
 */
export function generateBuyoutEntries(count: number, seed: number = 42): IBuyoutEntry[] {
  const rng = new SeededRandom(seed);
  const entries: IBuyoutEntry[] = [];
  const projectCodes = Array.from({ length: 10 }, () => randomProjectCode(rng));

  for (let i = 0; i < count; i++) {
    const divCode = rng.choice(DIVISION_CODES);
    const originalBudget = rng.int(5000, 2000000);
    const taxRate = rng.float(0.05, 0.09);
    const estimatedTax = Math.round(originalBudget * taxRate);
    const totalBudget = originalBudget + estimatedTax;
    const hasAward = rng.bool(0.6);
    const contractValue = hasAward ? rng.int(Math.round(totalBudget * 0.8), Math.round(totalBudget * 1.15)) : undefined;
    const status = rng.choice(BUYOUT_STATUSES);
    const commitmentStatus = rng.choice(COMMITMENT_STATUSES);
    const contractTrackingStatus = rng.choice(CONTRACT_TRACKING_STATUSES) as ContractTrackingStatus;

    const entry: IBuyoutEntry = {
      id: 500 + i,
      projectCode: rng.choice(projectCodes),
      divisionCode: divCode,
      divisionDescription: DIVISION_DESCRIPTIONS[divCode] || 'General',
      isStandard: rng.bool(0.7),
      originalBudget,
      estimatedTax,
      totalBudget,
      subcontractorName: hasAward ? rng.choice(SUBCONTRACTOR_NAMES) : undefined,
      contractValue,
      overUnder: contractValue !== undefined ? totalBudget - contractValue : undefined,
      enrolledInSDI: rng.bool(0.3),
      bondRequired: rng.bool(0.2),
      commitmentStatus,
      waiverRequired: rng.bool(0.15),
      approvalHistory: [] as ICommitmentApproval[],
      contractTrackingStatus,
      contractTrackingHistory: [],
      status,
      createdDate: randomDate(rng, 2025, 2026),
      modifiedDate: randomDate(rng, 2025, 2026),
    };

    // Add milestone dates for executed entries
    if (status === 'Executed' || status === 'Awarded') {
      entry.loiSentDate = randomDateOnly(rng, 2025, 2026);
      entry.loiReturnedDate = randomDateOnly(rng, 2025, 2026);
      entry.contractSentDate = randomDateOnly(rng, 2025, 2026);
      if (status === 'Executed') {
        entry.contractExecutedDate = randomDateOnly(rng, 2025, 2026);
        entry.insuranceCOIReceivedDate = randomDateOnly(rng, 2025, 2026);
      }
    }

    // Checklist items
    entry.scopeMatchesBudget = rng.bool(0.8);
    entry.exhibitCInsuranceConfirmed = rng.bool(0.7);
    entry.exhibitDScheduleConfirmed = rng.bool(0.6);
    entry.exhibitESafetyConfirmed = rng.bool(0.65);

    // Waiver details
    if (entry.waiverRequired) {
      entry.waiverType = rng.choice(['SDI', 'Bond', 'Insurance', 'Multiple'] as const);
      entry.waiverReason = `Waiver required for ${entry.divisionDescription}`;
    }

    // Approval history for progressed entries
    if (['PXApproved', 'ComplianceReview', 'CFOReview', 'Committed'].includes(commitmentStatus)) {
      const steps: ApprovalStep[] = ['PX'];
      if (['ComplianceReview', 'CFOReview', 'Committed'].includes(commitmentStatus)) steps.push('ComplianceManager');
      if (['CFOReview', 'Committed'].includes(commitmentStatus)) steps.push('CFO');

      entry.approvalHistory = steps.map((step, idx) => ({
        id: i * 10 + idx,
        buyoutEntryId: entry.id,
        projectCode: entry.projectCode,
        step,
        approverName: `Approver ${step}`,
        approverEmail: `approver.${step.toLowerCase()}@hedrickbrothers.com`,
        status: 'Approved' as const,
        actionDate: randomDate(rng, 2025, 2026),
      }));
    }

    entries.push(entry);
  }

  return entries;
}
