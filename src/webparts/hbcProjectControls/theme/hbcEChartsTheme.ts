/**
 * hbcEChartsTheme.ts
 * Registers Apache ECharts components (tree-shaking via echarts/core) and
 * defines the HBC corporate theme. Import once; subsequent calls are no-ops.
 */

import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  HeatmapChart,
  FunnelChart,
  TreemapChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  PolarComponent,
  DataZoomComponent,
  TitleComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { HBC_COLORS } from './tokens';

// ---------------------------------------------------------------------------
// Tree-shaking registration
// ---------------------------------------------------------------------------
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  GaugeChart,
  HeatmapChart,
  FunnelChart,
  TreemapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  PolarComponent,
  DataZoomComponent,
  TitleComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const PALETTE = [
  HBC_COLORS.navy,
  HBC_COLORS.orange,
  HBC_COLORS.success,
  HBC_COLORS.info,
  HBC_COLORS.warning,
  HBC_COLORS.lightNavy,
  HBC_COLORS.lightOrange,
  HBC_COLORS.scoreTierHigh,
  HBC_COLORS.scoreTierMid,
  HBC_COLORS.scoreTierLow,
  HBC_COLORS.gray400,
  HBC_COLORS.gray600,
];

// ---------------------------------------------------------------------------
// Tooltip formatter helper — uses only trusted data values (no user input)
// ---------------------------------------------------------------------------
function makeTooltipFormatter(): (params: unknown) => string {
  return (params: unknown): string => {
    // Handle array (multi-series) or single
    const items: Array<{ name: string; value: number | string; seriesName: string; marker?: string }> =
      Array.isArray(params) ? params : [params as { name: string; value: number | string; seriesName: string; marker?: string }];

    const rows = items
      .map(
        (p) =>
          `<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
             ${p.marker ?? ''}
             <span style="font-size:12px;color:${HBC_COLORS.gray600};flex:1">${p.seriesName}</span>
             <span style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${p.value}</span>
           </div>`
      )
      .join('');

    const name = items[0]?.name ?? '';
    return `
      <div style="font-family:'Segoe UI',system-ui,sans-serif;padding:4px 0">
        <div style="font-size:11px;color:${HBC_COLORS.gray400};margin-bottom:6px;font-weight:500">${name}</div>
        ${rows}
      </div>`;
  };
}

// ---------------------------------------------------------------------------
// HBC ECharts theme object
// ---------------------------------------------------------------------------
const HBC_ECHARTS_THEME_OBJ = {
  color: PALETTE,

  backgroundColor: HBC_COLORS.white,

  textStyle: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: HBC_COLORS.gray700,
  },

  title: {
    textStyle: {
      color: HBC_COLORS.navy,
      fontWeight: '600' as const,
      fontSize: 14,
    },
    subtextStyle: {
      color: HBC_COLORS.gray500,
      fontSize: 12,
    },
  },

  legend: {
    textStyle: {
      color: HBC_COLORS.gray600,
      fontSize: 12,
    },
    pageTextStyle: {
      color: HBC_COLORS.gray500,
    },
  },

  tooltip: {
    backgroundColor: HBC_COLORS.white,
    borderColor: HBC_COLORS.gray200,
    borderWidth: 1,
    textStyle: {
      color: HBC_COLORS.gray700,
      fontSize: 12,
    },
    extraCssText: `
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      padding: 10px 14px;
    `,
    formatter: makeTooltipFormatter(),
  },

  grid: {
    borderColor: HBC_COLORS.gray200,
    containLabel: true,
  },

  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: { color: HBC_COLORS.gray200 },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: HBC_COLORS.gray500,
      fontSize: 12,
    },
    splitLine: {
      show: false,
    },
  },

  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: HBC_COLORS.gray500,
      fontSize: 12,
    },
    splitLine: {
      lineStyle: {
        color: HBC_COLORS.gray100,
        type: 'dashed' as const,
      },
    },
  },

  line: {
    smooth: false,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 2,
    },
  },

  bar: {
    barMaxWidth: 60,
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
    },
  },

  pie: {
    itemStyle: {
      borderWidth: 2,
      borderColor: HBC_COLORS.white,
    },
  },

  radar: {
    axisLine: {
      lineStyle: { color: HBC_COLORS.gray200 },
    },
    splitLine: {
      lineStyle: { color: HBC_COLORS.gray100 },
    },
    splitArea: {
      areaStyle: {
        color: [HBC_COLORS.gray50, HBC_COLORS.white],
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Registration (idempotent)
// ---------------------------------------------------------------------------
let _registered = false;

export function registerHbcTheme(): void {
  if (_registered) return;
  echarts.registerTheme('hbc', HBC_ECHARTS_THEME_OBJ);
  _registered = true;
}

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------
export const HBC_ANIMATION = {
  /** Entry animation duration (ms) */
  duration: 600,
  /** Entry easing */
  easing: 'cubicOut' as const,
  /** Update animation duration (ms) — used for SignalR real-time refreshes */
  durationUpdate: 300,
  /** Update easing */
  easingUpdate: 'cubicInOut' as const,
};

// ---------------------------------------------------------------------------
// Gradient helpers
// ---------------------------------------------------------------------------
/** Navy → transparent vertical gradient (for area fills) */
export const NAVY_GRADIENT = {
  type: 'linear' as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: `${HBC_COLORS.navy}40` },
    { offset: 1, color: `${HBC_COLORS.navy}00` },
  ],
};

/** Orange → transparent vertical gradient */
export const ORANGE_GRADIENT = {
  type: 'linear' as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: `${HBC_COLORS.orange}40` },
    { offset: 1, color: `${HBC_COLORS.orange}00` },
  ],
};

/** Success → transparent vertical gradient */
export const SUCCESS_GRADIENT = {
  type: 'linear' as const,
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: `${HBC_COLORS.success}40` },
    { offset: 1, color: `${HBC_COLORS.success}00` },
  ],
};

// ---------------------------------------------------------------------------
// Sector / chart color arrays (used across multiple chart components)
// ---------------------------------------------------------------------------
export const SECTOR_COLORS = [
  HBC_COLORS.navy,
  HBC_COLORS.orange,
  HBC_COLORS.success,
  HBC_COLORS.info,
  HBC_COLORS.warning,
  HBC_COLORS.lightNavy,
  HBC_COLORS.lightOrange,
  HBC_COLORS.gray400,
  HBC_COLORS.scoreTierHigh,
  HBC_COLORS.scoreTierMid,
  HBC_COLORS.scoreTierLow,
  HBC_COLORS.gray600,
];
