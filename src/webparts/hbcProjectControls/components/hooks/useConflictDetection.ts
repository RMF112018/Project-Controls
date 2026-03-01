/**
 * Phase 3 (GNG Plan) — Timestamp-based conflict detection for concurrent scorecard editing.
 *
 * Strategy: last-writer-wins with user confirmation dialog.
 * Stores a baseline lastModifiedDate on mount/refetch, then compares before each mutation.
 * Only applies to score/field updates — comments and notes are append-only (no conflict).
 */
import * as React from 'react';
import type { IGoNoGoScorecard } from '@hbc/sp-services';

export interface IConflictDetectionResult {
  /** Whether a concurrent edit conflict has been detected */
  isConflicted: boolean;
  /** Email of the user who last modified the scorecard on the server */
  serverModifiedBy: string;
  /** ISO timestamp of the last server modification */
  serverModifiedDate: string;
  /** User chose to overwrite — proceed with mutation */
  confirmOverwrite: () => void;
  /** User chose to reload — discard local, refetch */
  confirmRefresh: () => void;
  /** User dismissed the dialog without action */
  dismiss: () => void;
  /** Wraps a mutation: checks for conflict before executing */
  wrapMutation: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useConflictDetection(
  scorecard: IGoNoGoScorecard | null | undefined,
  onRefresh?: () => void,
): IConflictDetectionResult {
  // Client baseline: the lastModifiedDate we've "seen" and accepted
  const baselineRef = React.useRef<string | undefined>(undefined);
  // Pending mutation function to execute after conflict resolution
  const pendingMutationRef = React.useRef<(() => Promise<unknown>) | null>(null);

  const [isConflicted, setIsConflicted] = React.useState(false);
  const [serverModifiedBy, setServerModifiedBy] = React.useState('');
  const [serverModifiedDate, setServerModifiedDate] = React.useState('');

  // Update baseline when scorecard data changes (initial load, refetch, etc.)
  React.useEffect(() => {
    if (scorecard?.lastModifiedDate) {
      baselineRef.current = scorecard.lastModifiedDate;
    }
  }, [scorecard?.lastModifiedDate]);

  const confirmOverwrite = React.useCallback(() => {
    // Accept the current server state as the new baseline
    baselineRef.current = new Date().toISOString();
    setIsConflicted(false);
    // Execute the pending mutation
    const fn = pendingMutationRef.current;
    pendingMutationRef.current = null;
    if (fn) void fn();
  }, []);

  const confirmRefresh = React.useCallback(() => {
    setIsConflicted(false);
    pendingMutationRef.current = null;
    onRefresh?.();
  }, [onRefresh]);

  const dismiss = React.useCallback(() => {
    setIsConflicted(false);
    pendingMutationRef.current = null;
  }, []);

  const wrapMutation = React.useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> => {
      const baseline = baselineRef.current;
      const serverDate = scorecard?.lastModifiedDate;

      // If we have a baseline and the server is newer, we have a conflict
      if (baseline && serverDate && serverDate > baseline) {
        setServerModifiedBy(scorecard?.lastModifiedBy ?? 'another user');
        setServerModifiedDate(serverDate);
        setIsConflicted(true);
        pendingMutationRef.current = fn as () => Promise<unknown>;
        // Return a rejected promise so the caller knows we paused
        return Promise.reject(new Error('Concurrent edit detected — awaiting user resolution'));
      }

      // No conflict — execute immediately and update baseline
      return fn().then((result) => {
        baselineRef.current = new Date().toISOString();
        return result;
      });
    },
    [scorecard?.lastModifiedDate, scorecard?.lastModifiedBy],
  );

  return {
    isConflicted,
    serverModifiedBy,
    serverModifiedDate,
    confirmOverwrite,
    confirmRefresh,
    dismiss,
    wrapMutation,
  };
}
