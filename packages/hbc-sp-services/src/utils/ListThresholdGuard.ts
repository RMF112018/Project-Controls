/**
 * ListThresholdGuard — Phase 5D Cross-cutting Governance
 *
 * Monitors SharePoint list item counts against the 5,000-item list view threshold.
 * - Warning at 3,000 (telemetry only, no behavioral change)
 * - Critical at 4,500 (force cursor paging)
 *
 * Exported singleton `listThresholdGuard` with default thresholds.
 */

import { LIST_THRESHOLD_WARNING, LIST_THRESHOLD_CRITICAL } from './constants';

// ── ThresholdLevel Enum ─────────────────────────────────────────────────────

export enum ThresholdLevel {
  Safe = 'safe',
  Warning = 'warning',
  Critical = 'critical',
}

// ── Result Interface ────────────────────────────────────────────────────────

export interface IThresholdResult {
  level: ThresholdLevel;
  message: string;
  shouldForceCursorPaging: boolean;
  itemCount: number;
  threshold: number;
}

// ── ListThresholdGuard Class ────────────────────────────────────────────────

export class ListThresholdGuard {
  constructor(
    private warningThreshold: number = LIST_THRESHOLD_WARNING,
    private criticalThreshold: number = LIST_THRESHOLD_CRITICAL,
  ) {}

  /**
   * Checks the item count against warning (3000) and critical (4500) thresholds.
   *
   * - Safe (< 3000): No action.
   * - Warning (3000–4499): Telemetry only; `shouldForceCursorPaging` = false.
   * - Critical (≥ 4500): `shouldForceCursorPaging` = true.
   */
  checkThreshold(listName: string, itemCount: number): IThresholdResult {
    if (itemCount >= this.criticalThreshold) {
      return {
        level: ThresholdLevel.Critical,
        message: `${listName} has ${itemCount} items (critical threshold ${this.criticalThreshold}). Cursor paging recommended.`,
        shouldForceCursorPaging: true,
        itemCount,
        threshold: this.criticalThreshold,
      };
    }

    if (itemCount >= this.warningThreshold) {
      return {
        level: ThresholdLevel.Warning,
        message: `${listName} has ${itemCount} items (warning threshold ${this.warningThreshold}). Approaching list view limit.`,
        shouldForceCursorPaging: false,
        itemCount,
        threshold: this.warningThreshold,
      };
    }

    return {
      level: ThresholdLevel.Safe,
      message: `${listName} has ${itemCount} items. Within safe range.`,
      shouldForceCursorPaging: false,
      itemCount,
      threshold: this.warningThreshold,
    };
  }

  /**
   * Threshold-governed check: use cursor paging when item volume is critical.
   */
  static shouldUseCursorPaging(itemCount: number): boolean {
    return itemCount >= LIST_THRESHOLD_CRITICAL;
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────

/** Default singleton instance with standard thresholds (3000 / 4500) */
export const listThresholdGuard = new ListThresholdGuard();
