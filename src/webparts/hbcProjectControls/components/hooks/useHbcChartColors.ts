import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { HBC_COLORS } from '../../theme/tokens';

/**
 * Resolved chart colors for the current theme mode.
 * ECharts is canvas-based and cannot use CSS custom properties —
 * all colors must be resolved hex values.
 */
export interface IHbcChartColors {
  /** Primary series color (navy in light / lightened navy in dark) */
  primary: string;
  /** Secondary series color (orange in light / lightened orange in dark) */
  secondary: string;
  /** Tertiary/muted series color (gray400 in light / lightened gray in dark) */
  muted: string;
  /** Success semantic color */
  success: string;
  /** Info semantic color */
  info: string;
  /** Warning semantic color */
  warning: string;
  /** Error/danger semantic color */
  error: string;
  /** Chart background — use for borders between segments (pie, funnel, treemap) */
  chartBackground: string;
  /** Heatmap low-range color (light green in light / dark green in dark) */
  heatmapLow: string;
  /** Whether dark mode is currently active (convenience flag for one-off overrides) */
  isDark: boolean;
}

// ---------------------------------------------------------------------------
// Static color maps — module-scope singletons for referential stability
// ---------------------------------------------------------------------------

/** Light-mode colors (same as HBC_COLORS equivalents) */
const LIGHT_COLORS: IHbcChartColors = {
  primary: HBC_COLORS.navy,        // #1B2A4A
  secondary: HBC_COLORS.orange,    // #B45309
  muted: HBC_COLORS.gray400,       // #6B7280
  success: HBC_COLORS.success,     // #047857
  info: HBC_COLORS.info,           // #1D4ED8
  warning: HBC_COLORS.warning,     // #B45309
  error: HBC_COLORS.error,         // #B42318
  chartBackground: '#FFFFFF',
  heatmapLow: '#D1FAE5',           // successLight
  isDark: false,
};

/** Dark-mode colors (matches DARK_PALETTE from hbcEChartsTheme.ts) */
const DARK_COLORS: IHbcChartColors = {
  primary: '#9DB3D4',              // lightened navy
  secondary: '#F5A623',            // lightened orange
  muted: '#9CA3AF',                // lightened gray400
  success: '#6EE7A8',              // lightened success
  info: '#60A5FA',                 // lightened info
  warning: '#FBC87A',              // lightened warning
  error: '#F87171',                // lightened error
  chartBackground: '#1C1C1C',      // dark surface
  heatmapLow: '#064E3B',           // dark green visible on dark bg
  isDark: true,
};

/**
 * Hook providing theme-aware resolved hex colors for ECharts.
 * Returns one of two static color maps based on the app's effective theme mode,
 * ensuring referential stability across renders when the mode hasn't changed.
 *
 * Respects the DarkModeSupport feature flag — when disabled, always returns light colors.
 */
export function useHbcChartColors(): IHbcChartColors {
  const { effectiveThemeMode, isFeatureEnabled } = useAppContext();
  const darkModeEnabled = isFeatureEnabled('DarkModeSupport');

  return React.useMemo(() => {
    if (!darkModeEnabled) return LIGHT_COLORS;
    return effectiveThemeMode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }, [darkModeEnabled, effectiveThemeMode]);
}
