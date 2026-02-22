import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useIsFetching } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';

const MIN_DISPLAY_MS = 200;

const useStyles = makeStyles({
  overlay: {
    position: 'absolute',
    inset: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'opacity',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
    },
  },
  spinner: {
    width: '32px',
    height: '32px',
    ...shorthands.border('3px', 'solid', tokens.colorNeutralStroke2),
    borderTopColor: tokens.colorBrandStroke1,
    ...shorthands.borderRadius('50%'),
    animationName: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: '0s',
    },
  },
});

/**
 * Translucent overlay shown on <main> during project switch.
 * Auto-dismisses when queries settle (useIsFetching === 0) after minimum display time.
 */
export const ShellHydrationOverlay: React.FC = () => {
  const styles = useStyles();
  const { isProjectSwitching } = useAppContext();
  const fetchingCount = useIsFetching();
  const [visible, setVisible] = React.useState(false);
  const showTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (isProjectSwitching) {
      setVisible(true);
      showTimeRef.current = Date.now();
      return;
    }
    if (visible && fetchingCount === 0) {
      const elapsed = Date.now() - showTimeRef.current;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const timer = setTimeout(() => setVisible(false), remaining);
      return () => clearTimeout(timer);
    }
    return;
  }, [isProjectSwitching, fetchingCount, visible]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} role="progressbar" aria-live="assertive" aria-label="Switching project context...">
      <div className={styles.spinner} />
    </div>
  );
};
