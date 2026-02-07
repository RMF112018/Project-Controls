import { createLightTheme, createDarkTheme, BrandVariants } from '@fluentui/react-components';
import { HBC_COLORS } from './tokens';

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

export const hbcLightTheme = {
  ...createLightTheme(hbcBrand),
  colorBrandForeground1: HBC_COLORS.navy,
  colorBrandBackground: HBC_COLORS.navy,
  colorBrandBackgroundHover: HBC_COLORS.lightNavy,
  colorNeutralForeground1: HBC_COLORS.gray900,
};

export const hbcDarkTheme = {
  ...createDarkTheme(hbcBrand),
};
