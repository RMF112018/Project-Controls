import type { Theme } from '@fluentui/react-components';
import { createLightTheme, createDarkTheme, BrandVariants } from '@fluentui/react-components';
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

export const hbcDarkTheme = {
  ...createDarkTheme(hbcBrand),
};
