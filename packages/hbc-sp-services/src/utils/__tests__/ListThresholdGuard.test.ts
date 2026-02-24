/**
 * ListThresholdGuard — Phase 5D Tests (8 tests)
 *
 * Coverage: Safe/Warning/Critical boundaries, dual-gate logic, message formatting.
 */

import {
  ListThresholdGuard,
  listThresholdGuard,
  ThresholdLevel,
} from '../ListThresholdGuard';

describe('ListThresholdGuard', () => {
  // ── checkThreshold boundary tests ───────────────────────────────────────

  it('returns Safe at 2999 items', () => {
    const result = listThresholdGuard.checkThreshold('Audit_Log', 2999);
    expect(result.level).toBe(ThresholdLevel.Safe);
    expect(result.shouldForceCursorPaging).toBe(false);
    expect(result.itemCount).toBe(2999);
    expect(result.threshold).toBe(3000);
  });

  it('returns Warning at exactly 3000 items with shouldForceCursorPaging=false', () => {
    const result = listThresholdGuard.checkThreshold('Audit_Log', 3000);
    expect(result.level).toBe(ThresholdLevel.Warning);
    expect(result.shouldForceCursorPaging).toBe(false);
    expect(result.itemCount).toBe(3000);
    expect(result.threshold).toBe(3000);
  });

  it('returns Warning at 4499 items (just below critical)', () => {
    const result = listThresholdGuard.checkThreshold('Audit_Log', 4499);
    expect(result.level).toBe(ThresholdLevel.Warning);
    expect(result.shouldForceCursorPaging).toBe(false);
    expect(result.itemCount).toBe(4499);
  });

  it('returns Critical at exactly 4500 items with shouldForceCursorPaging=true', () => {
    const result = listThresholdGuard.checkThreshold('Audit_Log', 4500);
    expect(result.level).toBe(ThresholdLevel.Critical);
    expect(result.shouldForceCursorPaging).toBe(true);
    expect(result.itemCount).toBe(4500);
    expect(result.threshold).toBe(4500);
  });

  // ── message formatting ──────────────────────────────────────────────────

  it('includes listName in the result message', () => {
    const result = listThresholdGuard.checkThreshold('Performance_Logs', 5000);
    expect(result.message).toContain('Performance_Logs');
    expect(result.message).toContain('5000');
  });

  // ── static shouldUseCursorPaging dual-gate ──────────────────────────────

  it('returns true only when both count >= 4500 AND isInfinitePagingEnabled', () => {
    expect(ListThresholdGuard.shouldUseCursorPaging(4500, true)).toBe(true);
    expect(ListThresholdGuard.shouldUseCursorPaging(5000, true)).toBe(true);
  });

  it('returns false when count >= 4500 but isInfinitePagingEnabled is false (count-only insufficient)', () => {
    expect(ListThresholdGuard.shouldUseCursorPaging(4500, false)).toBe(false);
    expect(ListThresholdGuard.shouldUseCursorPaging(10000, false)).toBe(false);
  });

  it('returns false when isInfinitePagingEnabled is true but count < 4500 (flag-only insufficient)', () => {
    expect(ListThresholdGuard.shouldUseCursorPaging(3000, true)).toBe(false);
    expect(ListThresholdGuard.shouldUseCursorPaging(4499, true)).toBe(false);
    expect(ListThresholdGuard.shouldUseCursorPaging(0, true)).toBe(false);
  });
});
