/**
 * useScoreTier — Memoized scorecard tier derivation.
 *
 * Wraps scoreCalculator.ts pure utilities in a React-friendly useMemo
 * so components can derive tier, color, label, and completion from
 * a scorecard without recomputing on every render.
 *
 * @example
 * ```tsx
 * const tier = useScoreTier(scorecard?.scores, 'committee');
 * if (tier) {
 *   return <Badge color={tier.color}>{tier.label} ({tier.completion}%)</Badge>;
 * }
 * ```
 */
import { useMemo } from 'react';
import {
  calculateTotalScore,
  getScoreTier,
  getScoreTierColor,
  getScoreTierLabel,
  getCompletionPercentage,
  getRecommendedDecision,
  type IGoNoGoScorecard,
} from '@hbc/sp-services';

export interface IScoreTierResult {
  totalScore: number;
  tier: 'high' | 'mid' | 'low';
  color: string;
  label: string;
  completion: number;
}

/**
 * Derives memoized score tier information from a scorecard's scores.
 * Returns null when scores are undefined (loading/empty state).
 */
export function useScoreTier(
  scores: IGoNoGoScorecard['scores'] | undefined,
  column: 'originator' | 'committee'
): IScoreTierResult | null {
  return useMemo(() => {
    if (!scores) return null;
    const totalScore = calculateTotalScore(scores, column);
    return {
      totalScore,
      tier: getScoreTier(totalScore),
      color: getScoreTierColor(totalScore),
      label: getScoreTierLabel(totalScore),
      completion: getCompletionPercentage(scores, column),
    };
  }, [scores, column]);
}

export { getRecommendedDecision };
