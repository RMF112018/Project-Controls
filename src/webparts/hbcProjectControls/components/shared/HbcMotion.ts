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

// ── Estimating-specific micro-animation presets ──────────────────────
// Phase 6 Task 2: Subtle motion on badges, status pills, score tiers,
// and accordion chevrons within PostBidAutopsyPage and DepartmentTrackingPage.
// All durations ≤150ms (durationFast). Reduced-motion collapses to ~0ms.
export const useEstimatingMotionStyles = makeStyles({
  /** Smooth color transition when score badge changes tier (green/amber/red) */
  scoreTransition: {
    transitionProperty: 'color, background-color',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
    },
  },
  /** Status pill / error badge enter: subtle scale-up + fade-in */
  pillAppear: {
    animationName: {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    animationDuration: tokens.durationFast,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: tokens.durationUltraFast,
    },
  },
  /** Reviewed / success badge enter: slightly more expressive scale-in */
  badgeScaleIn: {
    animationName: {
      from: { opacity: 0, transform: 'scale(0.8)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    animationDuration: tokens.durationFast,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: tokens.durationUltraFast,
    },
  },
  /** Accordion chevron rotation with ease-out deceleration */
  chevronRotate: {
    transitionProperty: 'transform',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveDecelerateMid,
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
    },
  },
  /** Accordion content expand/collapse via CSS grid row transition */
  accordionContent: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transitionProperty: 'grid-template-rows',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveDecelerateMid,
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
    },
  },
  /** Accordion content expanded state */
  accordionContentExpanded: {
    gridTemplateRows: '1fr',
  },
});
