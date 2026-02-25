import * as React from 'react';
import { performanceService } from '@hbc/sp-services';

export interface IUsePerformanceMarkerResult {
  /** Start the performance mark. */
  start: () => void;
  /** End the performance mark and record duration. */
  end: () => void;
  /** Duration in ms once mark is completed, or null if still open. */
  duration: number | null;
}

/**
 * Hook wrapping PerformanceService for component-level telemetry.
 *
 * @param label - Unique identifier for the mark (e.g. 'table:render', 'chart:render')
 * @param options.autoMeasure - When true, starts on mount and ends after rAF (first-paint proxy)
 */
export function usePerformanceMarker(
  label: string,
  options?: { autoMeasure?: boolean }
): IUsePerformanceMarkerResult {
  const [duration, setDuration] = React.useState<number | null>(null);

  const start = React.useCallback(() => {
    performanceService.startMark(label);
  }, [label]);

  const end = React.useCallback(() => {
    performanceService.endMark(label);
    const mark = performanceService.getMark(label);
    if (mark && mark.duration !== undefined) {
      setDuration(mark.duration);
    }
  }, [label]);

  React.useEffect(() => {
    if (!options?.autoMeasure) return;

    performanceService.startMark(label);

    const rafId = requestAnimationFrame(() => {
      performanceService.endMark(label);
      const mark = performanceService.getMark(label);
      if (mark && mark.duration !== undefined) {
        setDuration(mark.duration);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [label, options?.autoMeasure]);

  return { start, end, duration };
}
