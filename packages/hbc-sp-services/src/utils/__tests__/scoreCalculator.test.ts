import {
  calculateTotalScore,
  getScoreTier,
  getScoreTierLabel,
  getScoreTierColor,
  validateScore,
  isScorecardComplete,
  getCompletionPercentage,
  getRecommendedDecision,
} from '../scoreCalculator';
import { SCORECARD_CRITERIA, IGoNoGoScorecard } from '../../models/IGoNoGoScorecard';
import { GoNoGoDecision } from '../../models/enums';

describe('scoreCalculator', () => {
  describe('calculateTotalScore', () => {
    it('sums all originator scores correctly', () => {
      const scores: IGoNoGoScorecard['scores'] = {};
      for (const c of SCORECARD_CRITERIA) {
        scores[c.id] = { originator: c.high, committee: undefined };
      }
      const total = calculateTotalScore(scores, 'originator');
      // Sum of all high values = 92
      expect(total).toBe(92);
    });

    it('sums all committee scores correctly', () => {
      const scores: IGoNoGoScorecard['scores'] = {};
      for (const c of SCORECARD_CRITERIA) {
        scores[c.id] = { originator: undefined, committee: c.avg };
      }
      const total = calculateTotalScore(scores, 'committee');
      const expectedAvg = SCORECARD_CRITERIA.reduce((sum, c) => sum + c.avg, 0);
      expect(total).toBe(expectedAvg);
    });

    it('handles missing scores (partial scorecard)', () => {
      const scores: IGoNoGoScorecard['scores'] = {
        1: { originator: 6, committee: undefined },
        // rest missing
      };
      expect(calculateTotalScore(scores, 'originator')).toBe(6);
    });

    it('returns 0 for empty scores object', () => {
      expect(calculateTotalScore({}, 'originator')).toBe(0);
      expect(calculateTotalScore({}, 'committee')).toBe(0);
    });

    it('sums all low scores correctly', () => {
      const scores: IGoNoGoScorecard['scores'] = {};
      for (const c of SCORECARD_CRITERIA) {
        scores[c.id] = { originator: c.low, committee: undefined };
      }
      const total = calculateTotalScore(scores, 'originator');
      const expectedLow = SCORECARD_CRITERIA.reduce((sum, c) => sum + c.low, 0);
      expect(total).toBe(expectedLow);
    });
  });

  describe('getScoreTier', () => {
    it('returns "high" for score >= 69', () => {
      expect(getScoreTier(69)).toBe('high');
      expect(getScoreTier(92)).toBe('high');
      expect(getScoreTier(100)).toBe('high');
    });

    it('returns "mid" for score 55-68', () => {
      expect(getScoreTier(55)).toBe('mid');
      expect(getScoreTier(60)).toBe('mid');
      expect(getScoreTier(68)).toBe('mid');
    });

    it('returns "low" for score < 55', () => {
      expect(getScoreTier(54)).toBe('low');
      expect(getScoreTier(0)).toBe('low');
      expect(getScoreTier(30)).toBe('low');
    });

    it('boundary: 69 is high, 68 is mid', () => {
      expect(getScoreTier(69)).toBe('high');
      expect(getScoreTier(68)).toBe('mid');
    });

    it('boundary: 55 is mid, 54 is low', () => {
      expect(getScoreTier(55)).toBe('mid');
      expect(getScoreTier(54)).toBe('low');
    });
  });

  describe('getScoreTierLabel', () => {
    it('high → "Focus All Efforts"', () => {
      expect(getScoreTierLabel(69)).toBe('Focus All Efforts');
    });

    it('mid → "Pursue / Prioritize"', () => {
      expect(getScoreTierLabel(60)).toBe('Pursue / Prioritize');
    });

    it('low → "Drop"', () => {
      expect(getScoreTierLabel(30)).toBe('Drop');
    });
  });

  describe('getScoreTierColor', () => {
    it('high → #10B981 (green)', () => {
      expect(getScoreTierColor(69)).toBe('#10B981');
    });

    it('mid → #F59E0B (amber)', () => {
      expect(getScoreTierColor(60)).toBe('#F59E0B');
    });

    it('low → #EF4444 (red)', () => {
      expect(getScoreTierColor(30)).toBe('#EF4444');
    });
  });

  describe('validateScore', () => {
    it('returns true for valid criterion value (high)', () => {
      // Criterion 1: high=6, avg=4, low=2
      expect(validateScore(1, 6)).toBe(true);
    });

    it('returns true for valid criterion value (avg)', () => {
      expect(validateScore(1, 4)).toBe(true);
    });

    it('returns true for valid criterion value (low)', () => {
      expect(validateScore(1, 2)).toBe(true);
    });

    it('returns false for invalid value', () => {
      expect(validateScore(1, 5)).toBe(false);
      expect(validateScore(1, 0)).toBe(false);
    });

    it('returns false for unknown criterion id', () => {
      expect(validateScore(999, 6)).toBe(false);
    });
  });

  describe('isScorecardComplete', () => {
    it('returns true when all criteria have originator values', () => {
      const scores: IGoNoGoScorecard['scores'] = {};
      for (const c of SCORECARD_CRITERIA) {
        scores[c.id] = { originator: c.high, committee: undefined };
      }
      expect(isScorecardComplete(scores, 'originator')).toBe(true);
    });

    it('returns false when some criteria are missing', () => {
      const scores: IGoNoGoScorecard['scores'] = {
        1: { originator: 6, committee: undefined },
      };
      expect(isScorecardComplete(scores, 'originator')).toBe(false);
    });

    it('returns false for empty scores', () => {
      expect(isScorecardComplete({}, 'originator')).toBe(false);
    });
  });

  describe('getCompletionPercentage', () => {
    it('returns 100 when all criteria scored', () => {
      const scores: IGoNoGoScorecard['scores'] = {};
      for (const c of SCORECARD_CRITERIA) {
        scores[c.id] = { originator: c.high, committee: undefined };
      }
      expect(getCompletionPercentage(scores, 'originator')).toBe(100);
    });

    it('returns 0 for empty scores', () => {
      expect(getCompletionPercentage({}, 'originator')).toBe(0);
    });

    it('returns correct partial percentage', () => {
      const scores: IGoNoGoScorecard['scores'] = {};
      // Score half the criteria
      const half = Math.floor(SCORECARD_CRITERIA.length / 2);
      for (let i = 0; i < half; i++) {
        scores[SCORECARD_CRITERIA[i].id] = { originator: SCORECARD_CRITERIA[i].high, committee: undefined };
      }
      const expected = Math.round((half / SCORECARD_CRITERIA.length) * 100);
      expect(getCompletionPercentage(scores, 'originator')).toBe(expected);
    });
  });

  describe('getRecommendedDecision', () => {
    it('Go with Strong confidence for >= 69', () => {
      const result = getRecommendedDecision(75);
      expect(result.decision).toBe(GoNoGoDecision.Go);
      expect(result.confidence).toBe('Strong');
      expect(result.reasoning).toContain('75');
    });

    it('ConditionalGo with Moderate for 55-68', () => {
      const result = getRecommendedDecision(60);
      expect(result.decision).toBe(GoNoGoDecision.ConditionalGo);
      expect(result.confidence).toBe('Moderate');
    });

    it('NoGo with Strong for < 55', () => {
      const result = getRecommendedDecision(40);
      expect(result.decision).toBe(GoNoGoDecision.NoGo);
      expect(result.confidence).toBe('Strong');
    });

    it('boundary: 69 → Go', () => {
      expect(getRecommendedDecision(69).decision).toBe(GoNoGoDecision.Go);
    });

    it('boundary: 55 → ConditionalGo', () => {
      expect(getRecommendedDecision(55).decision).toBe(GoNoGoDecision.ConditionalGo);
    });

    it('boundary: 54 → NoGo', () => {
      expect(getRecommendedDecision(54).decision).toBe(GoNoGoDecision.NoGo);
    });
  });
});
