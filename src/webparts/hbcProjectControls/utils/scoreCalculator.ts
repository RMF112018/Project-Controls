import { SCORECARD_CRITERIA, IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
import { SCORE_THRESHOLDS } from './constants';

export function calculateTotalScore(scores: IGoNoGoScorecard['scores'], column: 'originator' | 'committee'): number {
  let total = 0;
  for (const criterion of SCORECARD_CRITERIA) {
    const score = scores[criterion.id];
    if (score) {
      const value = column === 'originator' ? score.originator : score.committee;
      if (value !== undefined) {
        total += value;
      }
    }
  }
  return total;
}

export function getScoreTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'high';
  if (score >= SCORE_THRESHOLDS.MID) return 'mid';
  return 'low';
}

export function getScoreTierLabel(score: number): string {
  const tier = getScoreTier(score);
  switch (tier) {
    case 'high': return 'Focus All Efforts';
    case 'mid': return 'Pursue / Prioritize';
    case 'low': return 'Drop';
  }
}

export function getScoreTierColor(score: number): string {
  const tier = getScoreTier(score);
  switch (tier) {
    case 'high': return '#10B981';
    case 'mid': return '#F59E0B';
    case 'low': return '#EF4444';
  }
}

export function validateScore(criterionId: number, value: number): boolean {
  const criterion = SCORECARD_CRITERIA.find(c => c.id === criterionId);
  if (!criterion) return false;
  return [criterion.high, criterion.avg, criterion.low].includes(value);
}

export function isScorecardComplete(scores: IGoNoGoScorecard['scores'], column: 'originator' | 'committee'): boolean {
  return SCORECARD_CRITERIA.every(criterion => {
    const score = scores[criterion.id];
    if (!score) return false;
    const value = column === 'originator' ? score.originator : score.committee;
    return value !== undefined;
  });
}

export function getCompletionPercentage(scores: IGoNoGoScorecard['scores'], column: 'originator' | 'committee'): number {
  let completed = 0;
  for (const criterion of SCORECARD_CRITERIA) {
    const score = scores[criterion.id];
    if (score) {
      const value = column === 'originator' ? score.originator : score.committee;
      if (value !== undefined) completed++;
    }
  }
  return Math.round((completed / SCORECARD_CRITERIA.length) * 100);
}
