import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsReactProps } from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import * as echartsCore from 'echarts/core';
import { makeStyles, tokens } from '@fluentui/react-components';
import { registerHbcTheme, HBC_ANIMATION } from '../../theme/hbcEChartsTheme';

// Register the HBC theme once at module load
registerHbcTheme();

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface IHbcEChartProps {
  /** The ECharts option object — should be built via useMemo in consuming component */
  option: EChartsOption;
  /** Chart height in pixels. Defaults to 300. */
  height?: number;
  /** Chart width. Defaults to '100%'. */
  width?: string | number;
  /** Shows loading overlay when true */
  loading?: boolean;
  /** Shows empty state when true */
  empty?: boolean;
  /** Message shown in empty state */
  emptyMessage?: string;
  /** Additional container styles */
  style?: React.CSSProperties;
  /** When false (default), ECharts merges new options for smooth transitions */
  notMerge?: boolean;
  /** Defers re-render to the next frame — useful for rapid SignalR updates */
  lazyUpdate?: boolean;
  /** ARIA label for accessibility (canvas is not screen-reader accessible) */
  ariaLabel?: string;
  /** ARIA description for screen readers */
  ariaDescription?: string;
  /** Event handlers — e.g. { 'click': handler } for drill-down navigation */
  onEvents?: EChartsReactProps['onEvents'];
  onChartReady?: EChartsReactProps['onChartReady'];
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const useStyles = makeStyles({
  container: {
    position: 'relative',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const HbcEChart: React.FC<IHbcEChartProps> = ({
  option,
  height = 300,
  width = '100%',
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
  style,
  notMerge = false,
  lazyUpdate = false,
  ariaLabel,
  ariaDescription,
  onEvents,
  onChartReady,
}) => {
  const styles = useStyles();
  const chartRef = React.useRef<ReactECharts | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------------------
  // Merge animation defaults into option
  // -------------------------------------------------------------------------
  const mergedOption = React.useMemo<EChartsOption>(
    () => ({
      animation: true,
      animationDuration: HBC_ANIMATION.duration,
      animationEasing: HBC_ANIMATION.easing,
      animationDurationUpdate: HBC_ANIMATION.durationUpdate,
      animationEasingUpdate: HBC_ANIMATION.easingUpdate,
      ...option,
    }),
    [option]
  );

  // -------------------------------------------------------------------------
  // ResizeObserver — triggers chart resize when container dimensions change
  // -------------------------------------------------------------------------
  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      const instance = chartRef.current?.getEchartsInstance?.();
      if (instance) {
        instance.resize();
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  if (empty) {
    return (
      <div
        ref={containerRef}
        className={styles.emptyState}
        style={{ height, width, ...style }}
        role="img"
        aria-label={ariaLabel ?? 'Empty chart'}
      >
        {emptyMessage}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const loadingOption = {
    text: '',
    color: '#1B2A4A',
    maskColor: 'rgba(255, 255, 255, 0.7)',
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ height, width, ...style }}
      role="img"
      aria-label={ariaLabel}
      aria-description={ariaDescription}
    >
      <ReactECharts
        ref={chartRef}
        echarts={echartsCore}
        option={mergedOption}
        theme="hbc"
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
        showLoading={loading}
        loadingOption={loadingOption}
        opts={{ renderer: 'canvas', useDirtyRect: true } as { renderer: 'canvas'; useDirtyRect: boolean }}
        onEvents={onEvents}
        onChartReady={onChartReady}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};
