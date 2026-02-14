import { SCORECARD_CRITERIA, IGoNoGoScorecard } from '../models/IGoNoGoScorecard';
import { GoNoGoDecision } from '../models/enums';
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

export function getRecommendedDecision(committeeTotal: number): {
  decision: GoNoGoDecision;
  confidence: 'Strong' | 'Moderate' | 'Weak';
  reasoning: string;
} {
  if (committeeTotal >= SCORE_THRESHOLDS.HIGH) {
    return {
      decision: GoNoGoDecision.Go,
      confidence: 'Strong',
      reasoning: `Committee score of ${committeeTotal} exceeds the Go threshold of ${SCORE_THRESHOLDS.HIGH}`,
    };
  } else if (committeeTotal >= SCORE_THRESHOLDS.MID) {
    return {
      decision: GoNoGoDecision.ConditionalGo,
      confidence: 'Moderate',
      reasoning: `Committee score of ${committeeTotal} falls between thresholds (${SCORE_THRESHOLDS.MID}\u2013${SCORE_THRESHOLDS.HIGH}). Consider conditional approval.`,
    };
  } else {
    return {
      decision: GoNoGoDecision.NoGo,
      confidence: 'Strong',
      reasoning: `Committee score of ${committeeTotal} is below the minimum threshold of ${SCORE_THRESHOLDS.MID}`,
    };
  }
}
