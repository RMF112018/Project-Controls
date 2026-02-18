/**
 * Jest mock for echarts/core and all echarts/* sub-path imports.
 * Stubs the ECharts API surface used by hbcEChartsTheme.ts and HbcEChart.tsx.
 */

export const use = jest.fn();
export const registerTheme = jest.fn();
export const init = jest.fn(() => ({
  setOption: jest.fn(),
  resize: jest.fn(),
  dispose: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getOption: jest.fn(() => ({})),
}));

// Stub LinearGradient used in gradient helpers
export class graphic {
  static LinearGradient = class {
    constructor(
      public x: number,
      public y: number,
      public x2: number,
      public y2: number,
      public colorStops: unknown[]
    ) {}
  };
}

export default {
  use,
  registerTheme,
  init,
  graphic,
};
