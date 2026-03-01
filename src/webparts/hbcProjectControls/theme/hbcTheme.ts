import type { Theme } from '@fluentui/react-components';
import { createLightTheme, createDarkTheme, teamsHighContrastTheme, BrandVariants } from '@fluentui/react-components';
import { HBC_COLORS, ELEVATION } from './tokens';

const hbcBrand: BrandVariants = {
  10: '#050A14',
  20: '#0F1A2E',
  30: '#142240',
  40: '#192B52',
  50: '#1B2A4A',
  60: '#2C3E6B',
  70: '#3D5280',
  80: '#4E6695',
  90: '#6880AA',
  100: '#8299BF',
  110: '#9DB3D4',
  120: '#B8CDE9',
  130: '#D3E7FE',
  140: '#E9F3FF',
  150: '#F4F9FF',
  160: '#FAFCFF',
};

export const hbcLightTheme: Theme = {
  ...createLightTheme(hbcBrand),

  // Brand foreground
  colorBrandForeground1: HBC_COLORS.navy,
  colorBrandForeground2: HBC_COLORS.lightNavy,
  colorBrandForegroundLink: HBC_COLORS.navy,
  colorBrandForegroundLinkHover: HBC_COLORS.lightNavy,
  colorBrandForegroundLinkPressed: HBC_COLORS.darkNavy,

  // Brand background
  colorBrandBackground: HBC_COLORS.navy,
  colorBrandBackgroundHover: HBC_COLORS.lightNavy,
  colorBrandBackgroundPressed: HBC_COLORS.darkNavy,
  colorBrandBackgroundSelected: HBC_COLORS.lightNavy,

  // Neutral foreground
  colorNeutralForeground1: HBC_COLORS.gray900,
  colorNeutralForeground2: HBC_COLORS.gray700,
  colorNeutralForeground3: HBC_COLORS.gray500,
  colorNeutralForeground4: HBC_COLORS.gray400,
  colorNeutralForegroundDisabled: HBC_COLORS.gray300,

  // Neutral background
  colorNeutralBackground1: HBC_COLORS.white,
  colorNeutralBackground2: HBC_COLORS.gray50,
  colorNeutralBackground3: HBC_COLORS.gray100,
  colorNeutralBackground4: HBC_COLORS.gray200,
  colorNeutralBackground5: HBC_COLORS.gray300,

  // Stroke
  colorNeutralStroke1: HBC_COLORS.gray200,
  colorNeutralStroke2: HBC_COLORS.gray300,
  colorNeutralStrokeAccessible: HBC_COLORS.gray500,

  // Subtle background (hover states)
  colorSubtleBackground: 'transparent',
  colorSubtleBackgroundHover: HBC_COLORS.gray100,
  colorSubtleBackgroundPressed: HBC_COLORS.gray200,
  colorSubtleBackgroundSelected: HBC_COLORS.gray100,

  // Status tokens
  colorStatusSuccessBackground1: HBC_COLORS.successLight,
  colorStatusSuccessForeground1: '#065F46',
  colorStatusWarningBackground1: HBC_COLORS.warningLight,
  colorStatusWarningForeground1: '#92400E',
  colorStatusDangerBackground1: HBC_COLORS.errorLight,
  colorStatusDangerForeground1: '#991B1B',

  // Shadows (map ELEVATION)
  shadow2: ELEVATION.level1,
  shadow4: ELEVATION.level2,
  shadow8: ELEVATION.level3,
  shadow16: ELEVATION.level4,
};

// ---------------------------------------------------------------------------
// Dark elevation shadows — deeper for perceptible hierarchy on dark surfaces
// ---------------------------------------------------------------------------
const DARK_ELEVATION = {
  level1: '0 1px 2px rgba(0,0,0,0.24), 0 1px 3px rgba(0,0,0,0.36)',
  level2: '0 2px 6px rgba(0,0,0,0.36), 0 4px 12px rgba(0,0,0,0.28)',
  level3: '0 4px 16px rgba(0,0,0,0.40)',
  level4: '0 8px 32px rgba(0,0,0,0.50)',
} as const;

export const hbcDarkTheme: Theme = {
  ...createDarkTheme(hbcBrand),

  // Brand foreground — lightened navy tints for readability on dark surfaces
  colorBrandForeground1: '#9DB3D4',
  colorBrandForeground2: '#B8CDE9',
  colorBrandForegroundLink: '#9DB3D4',
  colorBrandForegroundLinkHover: '#B8CDE9',
  colorBrandForegroundLinkPressed: '#8299BF',

  // Brand background — navy header remains HBC brand
  colorBrandBackground: HBC_COLORS.navy,
  colorBrandBackgroundHover: '#2C3E6B',
  colorBrandBackgroundPressed: '#0F1A2E',
  colorBrandBackgroundSelected: '#2C3E6B',

  // Neutral foreground — light text hierarchy on dark
  colorNeutralForeground1: '#E5E5E5',
  colorNeutralForeground2: '#C8C8C8',
  colorNeutralForeground3: '#999999',
  colorNeutralForeground4: '#707070',
  colorNeutralForegroundDisabled: '#505050',

  // Neutral background — dark surface hierarchy
  colorNeutralBackground1: '#1C1C1C',  // card surface
  colorNeutralBackground2: '#141414',  // page background
  colorNeutralBackground3: '#252525',  // elevated surface
  colorNeutralBackground4: '#2E2E2E',  // hover/active surface
  colorNeutralBackground5: '#383838',

  // Stroke — subtle borders on dark
  colorNeutralStroke1: '#3A3A3A',
  colorNeutralStroke2: '#2E2E2E',
  colorNeutralStrokeAccessible: '#707070',

  // Subtle background — hover states on dark
  colorSubtleBackground: 'transparent',
  colorSubtleBackgroundHover: '#252525',
  colorSubtleBackgroundPressed: '#2E2E2E',
  colorSubtleBackgroundSelected: '#252525',

  // Status tokens — WCAG 2.2 AA on dark backgrounds (#1C1C1C)
  colorStatusSuccessBackground1: '#0D2818',
  colorStatusSuccessForeground1: '#6EE7A8',
  colorStatusWarningBackground1: '#2D1B00',
  colorStatusWarningForeground1: '#FBC87A',
  colorStatusDangerBackground1: '#2D0A0A',
  colorStatusDangerForeground1: '#FCA5A5',

  // Shadows — deeper for dark mode
  shadow2: DARK_ELEVATION.level1,
  shadow4: DARK_ELEVATION.level2,
  shadow8: DARK_ELEVATION.level3,
  shadow16: DARK_ELEVATION.level4,
};

// High-contrast theme — Fluent UI v9 built-in, no custom overrides needed.
// CSS forced-colors: active handles system color mapping automatically.
export const hbcHighContrastTheme: Theme = teamsHighContrastTheme;
