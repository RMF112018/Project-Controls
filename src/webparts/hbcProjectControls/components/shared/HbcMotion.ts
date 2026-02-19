import { makeStyles, tokens } from '@fluentui/react-components';
import type { IHbcDataTableMotionConfig } from './HbcDataTable';

export type HbcMotionPreset = 'subtle' | 'standard' | 'expressive';

export interface IHbcMotionConfig extends IHbcDataTableMotionConfig {
  preset?: HbcMotionPreset;
  respectReducedMotion?: boolean;
}

export const HBC_MOTION_MAX_MS = 300;

const MOTION_DURATION_BY_PRESET: Record<HbcMotionPreset, number> = {
  subtle: 120,
  standard: 200,
  expressive: 280,
};

function clampDuration(durationMs: number): number {
  return Math.max(0, Math.min(durationMs, HBC_MOTION_MAX_MS));
}

export function resolveMotionDuration(config?: IHbcMotionConfig): string {
  if (config?.enabled === false) {
    return tokens.durationUltraFast;
  }

  const baseDuration = config?.durationMs ?? MOTION_DURATION_BY_PRESET[config?.preset ?? 'standard'];
  const clamped = clampDuration(baseDuration);

  if (clamped <= 80) {
    return tokens.durationUltraFast;
  }
  if (clamped <= 140) {
    return tokens.durationFaster;
  }
  if (clamped <= 220) {
    return tokens.durationNormal;
  }
  return tokens.durationSlow;
}

export const useHbcMotionStyles = makeStyles({
  routeTransition: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveDecelerateMid,
  },
  optimisticFade: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  rowReorder: {
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  dialogEntrance: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveDecelerateMid,
  },
  panelEntrance: {
    transitionProperty: 'opacity, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveDecelerateMid,
  },
  chartTableGlow: {
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    boxShadow: `0 0 0 ${tokens.strokeWidthThin} ${tokens.colorBrandStroke1}`,
  },
  chartTableGlowActive: {
    boxShadow: `0 0 0 ${tokens.strokeWidthThick} ${tokens.colorBrandStroke1}, 0 0 0 ${tokens.spacingHorizontalS} ${tokens.colorBrandBackground2}`,
  },
  shimmer: {
    transitionProperty: 'opacity',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  reducedMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
      animationDuration: tokens.durationUltraFast,
      animationIterationCount: '1',
    },
  },
});
