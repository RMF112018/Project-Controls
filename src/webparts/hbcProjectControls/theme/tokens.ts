import * as React from 'react';

export const HBC_COLORS = {
  // Primary brand
  navy: '#1B2A4A',
  orange: '#E87722',
  white: '#FFFFFF',

  // Secondary
  lightNavy: '#2C3E6B',
  darkNavy: '#0F1A2E',
  lightOrange: '#F5A623',
  darkOrange: '#C45E0A',

  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Score tiers
  scoreTierHigh: '#10B981',     // 69+ - green
  scoreTierMid: '#F59E0B',      // 55-68 - amber
  scoreTierLow: '#EF4444',      // Below 55 - red
} as const;

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1024,
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const ELEVATION = {
  level0: 'none',
  level1: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
  level2: '0 2px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.08)',
  level3: '0 4px 16px rgba(0,0,0,0.12)',
  level4: '0 8px 32px rgba(0,0,0,0.18)',
} as const;

export const RISK_INDICATOR = {
  style: (color: string, glow?: boolean): React.CSSProperties => ({
    borderLeft: `4px solid ${color}`,
    ...(glow ? { boxShadow: `inset 3px 0 8px -4px ${color}40` } : {}),
  }),
  colors: {
    critical: HBC_COLORS.error,
    warning: HBC_COLORS.warning,
    success: HBC_COLORS.success,
    info: HBC_COLORS.info,
    neutral: HBC_COLORS.gray300,
  },
};
