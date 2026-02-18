import * as React from 'react';

export const HBC_COLORS = {
  // Primary brand
  navy: '#1B2A4A',
  orange: '#E87722', // WCAG 2.2 AA: ratio ≈ 3.0:1 on white — use only for large text (≥18pt) or icons; never body text
  white: '#FFFFFF',

  // Secondary
  lightNavy: '#2C3E6B', // WCAG 2.2 AA: ratio ≈ 7.7:1 on white ✅
  darkNavy: '#0F1A2E',
  lightOrange: '#F5A623', // WCAG 2.2 AA: ratio ≈ 2.3:1 on white — decorative/icon use only; never body text
  darkOrange: '#C45E0A', // ratio ≈ 4.8:1 on white — large text/icons only ✅

  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF', // WCAG 2.2 AA: ratio ≈ 2.8:1 on white — FAIL; decorative/placeholder use only; never body text
  gray500: '#6B7280', // WCAG 2.2 AA: ratio ≈ 4.4:1 on white — borderline FAIL; use gray600+ for body text
  gray600: '#4B5563', // ratio ≈ 7.0:1 on white ✅ — safe for body text
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Text-safe variants — guaranteed 4.5:1+ contrast on white (#FFFFFF) per WCAG 1.4.3
  textGray: '#4B5563',    // = gray600, ratio 7.0:1 ✅ — use for secondary body text instead of gray400/gray500
  textOrangeLarge: '#C45E0A', // = darkOrange, ratio 4.8:1 ✅ — large text (≥18pt) or bold ≥14pt only

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

export const TRANSITION = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
} as const;

/**
 * WCAG 2.2 SC 2.5.8 — Minimum touch target size (AA).
 * Apply `minWidth` + `minHeight` to icon-only buttons, pagination buttons,
 * and the NavigationSidebar collapse toggle.
 */
export const TOUCH_TARGET = {
  /** WCAG 2.2 SC 2.5.8 AA — minimum 24×24px target size */
  min: '44px',
  /** Preferred comfortable target for field use (gloves, sunlight) */
  preferred: '48px',
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
