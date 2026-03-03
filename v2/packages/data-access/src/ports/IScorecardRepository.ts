import type {
  IGoNoGoScorecard,
  IScorecardVersion,
  GoNoGoDecision,
  IPersonAssignment,
} from '@hbc/models';

/**
 * Go/No-Go scorecard repository — scorecard lifecycle, workflow, versions.
 */
export interface IScorecardRepository {
  getByLeadId(leadId: number): Promise<IGoNoGoScorecard | null>;
  getAll(): Promise<IGoNoGoScorecard[]>;
  create(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard>;
  update(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard>;
  submitDecision(scorecardId: number, decision: GoNoGoDecision, projectCode?: string): Promise<void>;

  // Scorecard workflow
  submit(scorecardId: number, submittedBy: string, approverOverride?: IPersonAssignment): Promise<IGoNoGoScorecard>;
  respondToSubmission(scorecardId: number, approved: boolean, comment: string): Promise<IGoNoGoScorecard>;
  enterCommitteeScores(scorecardId: number, scores: Record<string, number>, enteredBy: string): Promise<IGoNoGoScorecard>;
  recordFinalDecision(scorecardId: number, decision: GoNoGoDecision, conditions?: string, decidedBy?: string): Promise<IGoNoGoScorecard>;
  unlock(scorecardId: number, reason: string): Promise<IGoNoGoScorecard>;
  relock(scorecardId: number, startNewCycle: boolean): Promise<IGoNoGoScorecard>;
  getVersions(scorecardId: number): Promise<IScorecardVersion[]>;
  reject(scorecardId: number, reason: string): Promise<IGoNoGoScorecard>;
  archive(scorecardId: number, archivedBy: string): Promise<IGoNoGoScorecard>;
}
