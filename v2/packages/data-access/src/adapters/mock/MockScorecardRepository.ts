import type { IGoNoGoScorecard, IScorecardVersion, GoNoGoDecision, IPersonAssignment } from '@hbc/models';
import type { IScorecardRepository } from '../../ports/IScorecardRepository';

export class MockScorecardRepository implements IScorecardRepository {
  private scorecards: IGoNoGoScorecard[] = [];
  async getByLeadId(_leadId: number): Promise<IGoNoGoScorecard | null> { return this.scorecards.find(s => s.leadId === _leadId) ?? null; }
  async getAll(): Promise<IGoNoGoScorecard[]> { return [...this.scorecards]; }
  async create(data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> { const s = { id: this.scorecards.length + 1, ...data } as IGoNoGoScorecard; this.scorecards.push(s); return s; }
  async update(id: number, data: Partial<IGoNoGoScorecard>): Promise<IGoNoGoScorecard> { const idx = this.scorecards.findIndex(s => s.id === id); if (idx === -1) throw new Error('Not found'); this.scorecards[idx] = { ...this.scorecards[idx], ...data }; return this.scorecards[idx]; }
  async submitDecision(_scorecardId: number, _decision: GoNoGoDecision, _projectCode?: string): Promise<void> {}
  async submit(_scorecardId: number, _submittedBy: string, _approverOverride?: IPersonAssignment): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async respondToSubmission(_scorecardId: number, _approved: boolean, _comment: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async enterCommitteeScores(_scorecardId: number, _scores: Record<string, number>, _enteredBy: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async recordFinalDecision(_scorecardId: number, _decision: GoNoGoDecision, _conditions?: string, _decidedBy?: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async unlock(_scorecardId: number, _reason: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async relock(_scorecardId: number, _startNewCycle: boolean): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async getVersions(_scorecardId: number): Promise<IScorecardVersion[]> { return []; }
  async reject(_scorecardId: number, _reason: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
  async archive(_scorecardId: number, _archivedBy: string): Promise<IGoNoGoScorecard> { throw new Error('Not implemented'); }
}
