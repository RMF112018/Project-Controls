import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { resolveMotionDuration, useHbcMotionStyles } from './HbcMotion';

export type HbcSkeletonVariant = 'text' | 'table' | 'kpi-grid' | 'form' | 'card';

export interface IHbcSkeletonProps {
  variant?: HbcSkeletonVariant;
  rows?: number;
  columns?: number;
  animated?: boolean;
  ariaLabel?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  shimmerBase: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    '::after': {
      content: '""',
      position: 'absolute',
      insetBlockStart: 0,
      insetInlineStart: '-100%',
      inlineSize: '100%',
      blockSize: '100%',
      backgroundImage: `linear-gradient(90deg, ${tokens.colorTransparentBackground}, ${tokens.colorNeutralBackground4}, ${tokens.colorTransparentBackground})`,
      animationName: {
        from: { transform: 'translateX(0)' },
        to: { transform: 'translateX(200%)' },
      },
      animationTimingFunction: tokens.curveEasyEase,
      animationIterationCount: 'infinite',
    },
  },
  shimmerStatic: {
    '::after': {
      display: 'none',
    },
  },
  textLine: {
    blockSize: tokens.spacingVerticalS,
  },
  textLineShort: {
    inlineSize: '65%',
  },
  textLineMedium: {
    inlineSize: '85%',
  },
  textLineFull: {
    inlineSize: '100%',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  kpiCard: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  formRow: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  labelLine: {
    inlineSize: '35%',
    blockSize: tokens.spacingVerticalXS,
  },
  inputLine: {
    inlineSize: '100%',
    blockSize: tokens.spacingVerticalL,
  },
  card: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
});

function renderTextSkeleton(styles: ReturnType<typeof useStyles>, animatedClass: string): React.ReactElement {
  return (
    <>
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineFull, animatedClass)} />
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineMedium, animatedClass)} />
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineShort, animatedClass)} />
    </>
  );
}

function renderTableSkeleton(
  styles: ReturnType<typeof useStyles>,
  animatedClass: string,
  rows: number
): React.ReactElement {
  return (
    <>
      <div className={styles.tableHeader}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`header-${index}`} className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineMedium, animatedClass)} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.tableRow}>
          {Array.from({ length: 4 }).map((__, cellIndex) => (
            <div
              key={`row-${rowIndex}-cell-${cellIndex}`}
              className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineFull, animatedClass)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function renderKpiGridSkeleton(
  styles: ReturnType<typeof useStyles>,
  animatedClass: string,
  columns: number
): React.ReactElement {
  return (
    <div className={styles.kpiGrid}>
      {Array.from({ length: columns }).map((_, index) => (
        <div key={`kpi-${index}`} className={styles.kpiCard}>
          <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineMedium, animatedClass)} />
          <div className={mergeClasses(styles.shimmerBase, styles.inputLine, animatedClass)} />
          <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineShort, animatedClass)} />
        </div>
      ))}
    </div>
  );
}

function renderFormSkeleton(
  styles: ReturnType<typeof useStyles>,
  animatedClass: string,
  rows: number
): React.ReactElement {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`form-${index}`} className={styles.formRow}>
          <div className={mergeClasses(styles.shimmerBase, styles.labelLine, animatedClass)} />
          <div className={mergeClasses(styles.shimmerBase, styles.inputLine, animatedClass)} />
        </div>
      ))}
    </>
  );
}

function renderCardSkeleton(styles: ReturnType<typeof useStyles>, animatedClass: string): React.ReactElement {
  return (
    <div className={styles.card}>
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineMedium, animatedClass)} />
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineFull, animatedClass)} />
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineFull, animatedClass)} />
      <div className={mergeClasses(styles.shimmerBase, styles.textLine, styles.textLineShort, animatedClass)} />
    </div>
  );
}

export const HbcSkeleton: React.FC<IHbcSkeletonProps> = ({
  variant = 'text',
  rows = 3,
  columns = 3,
  animated = true,
  ariaLabel = 'Loading content',
}) => {
  const styles = useStyles();
  const motionStyles = useHbcMotionStyles();

  const motionDuration = resolveMotionDuration({ enabled: animated, preset: 'subtle' });

  const animatedClass = animated
    ? mergeClasses(motionStyles.shimmer, motionStyles.reducedMotion)
    : styles.shimmerStatic;

  const content = (() => {
    switch (variant) {
      case 'table':
        return renderTableSkeleton(styles, animatedClass, rows);
      case 'kpi-grid':
        return renderKpiGridSkeleton(styles, animatedClass, columns);
      case 'form':
        return renderFormSkeleton(styles, animatedClass, rows);
      case 'card':
        return renderCardSkeleton(styles, animatedClass);
      case 'text':
      default:
        return renderTextSkeleton(styles, animatedClass);
    }
  })();

  return (
    <div className={styles.root} aria-label={ariaLabel} aria-busy="true" role="status" data-motion-duration={motionDuration}>
      {content}
    </div>
  );
};

export default HbcSkeleton;
