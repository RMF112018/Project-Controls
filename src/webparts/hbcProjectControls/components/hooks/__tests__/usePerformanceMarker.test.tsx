import { renderHook, act } from '@testing-library/react';
import { usePerformanceMarker } from '../usePerformanceMarker';
import { performanceService } from '@hbc/sp-services';

// Stub requestAnimationFrame for autoMeasure
let rafCallback: FrameRequestCallback | null = null;
const originalRAF = globalThis.requestAnimationFrame;
const originalCAF = globalThis.cancelAnimationFrame;

beforeEach(() => {
  performanceService.reset();
  globalThis.requestAnimationFrame = jest.fn((cb) => {
    rafCallback = cb;
    return 1;
  }) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = jest.fn();
});

afterEach(() => {
  rafCallback = null;
  globalThis.requestAnimationFrame = originalRAF;
  globalThis.cancelAnimationFrame = originalCAF;
});

describe('usePerformanceMarker', () => {
  it('manual start/end records correct duration', () => {
    const { result } = renderHook(() => usePerformanceMarker('test:manual'));

    expect(result.current.duration).toBeNull();

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.end();
    });

    expect(result.current.duration).toBeGreaterThanOrEqual(0);
    expect(performanceService.getMark('test:manual')).toBeDefined();
  });

  it('autoMeasure starts on mount and ends after rAF', () => {
    const { result } = renderHook(() =>
      usePerformanceMarker('test:auto', { autoMeasure: true })
    );

    // Before rAF fires, duration should be null
    expect(result.current.duration).toBeNull();

    // Fire the rAF callback
    act(() => {
      if (rafCallback) rafCallback(performance.now());
    });

    expect(result.current.duration).toBeGreaterThanOrEqual(0);
    expect(performanceService.getMark('test:auto')).toBeDefined();
  });

  it('cancels rAF on unmount', () => {
    const { unmount } = renderHook(() =>
      usePerformanceMarker('test:cleanup', { autoMeasure: true })
    );

    unmount();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
