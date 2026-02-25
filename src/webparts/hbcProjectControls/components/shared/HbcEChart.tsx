import * as React from 'react';
import type { EChartsReactProps } from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { makeStyles, tokens } from '@fluentui/react-components';

interface IEChartsRuntime {
  ReactECharts: React.ComponentType<EChartsReactProps & { ref?: React.Ref<unknown> }>;
  echartsCore: unknown;
  animation: {
    duration: number;
    easing: string;
    durationUpdate: number;
    easingUpdate: string;
  };
}

const DEFAULT_ANIMATION = {
  duration: 600,
  easing: 'cubicOut',
  durationUpdate: 300,
  easingUpdate: 'cubicOut',
} as const;

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
  linkedTableId?: string;
  highlightKey?: string | null;
  onDataPointSelect?: (payload: IHbcChartSelection) => void;
  /** When true, injects `large: true` + `largeThreshold: 200` per series for GPU-accelerated rendering */
  large?: boolean;
  /** When true, enables progressive rendering (200 data points per frame) for large datasets */
  progressiveRender?: boolean;
  /** Data downsampling strategy — useful for line/scatter charts with 1000+ points */
  sampling?: 'lttb' | 'average' | 'max' | 'min';
}

export interface IHbcChartSelection {
  dimension: string;
  value: string;
  series?: string;
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
// Visually-hidden style for screen-reader-only content
const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
};

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
  linkedTableId,
  highlightKey,
  onDataPointSelect,
  large,
  progressiveRender,
  sampling,
}) => {
  const styles = useStyles();
  const chartRef = React.useRef<{ getEchartsInstance?: () => { resize: () => void } } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [runtime, setRuntime] = React.useState<IEChartsRuntime | null>(null);
  // Stable unique ID for aria-describedby association
  const descriptionId = React.useId();

  React.useEffect(() => {
    let isMounted = true;

    const loadRuntime = async (): Promise<void> => {
      const [echartsReactMod, echartsCoreMod, themeMod] = await Promise.all([
        import(/* webpackChunkName: "lib-echarts-runtime" */ 'echarts-for-react'),
        import(/* webpackChunkName: "lib-echarts-runtime" */ 'echarts/core'),
        import(/* webpackChunkName: "lib-echarts-runtime" */ '../../theme/hbcEChartsTheme'),
      ]);

      themeMod.registerHbcTheme();

      if (isMounted) {
        setRuntime({
          ReactECharts: echartsReactMod.default as React.ComponentType<
            EChartsReactProps & { ref?: React.Ref<unknown> }
          >,
          echartsCore: echartsCoreMod,
          animation: {
            duration: themeMod.HBC_ANIMATION.duration,
            easing: themeMod.HBC_ANIMATION.easing,
            durationUpdate: themeMod.HBC_ANIMATION.durationUpdate,
            easingUpdate: themeMod.HBC_ANIMATION.easingUpdate,
          },
        });
      }
    };

    loadRuntime().catch((err) => {
      console.error('[HbcEChart] Failed to load ECharts runtime:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Merge animation defaults into option
  // -------------------------------------------------------------------------
  const mergedOption = React.useMemo<EChartsOption>(() => {
    const base: EChartsOption = {
      animation: true,
      animationDuration: runtime?.animation.duration ?? DEFAULT_ANIMATION.duration,
      animationEasing: (runtime?.animation.easing ?? DEFAULT_ANIMATION.easing) as never,
      animationDurationUpdate: runtime?.animation.durationUpdate ?? DEFAULT_ANIMATION.durationUpdate,
      animationEasingUpdate: (runtime?.animation.easingUpdate ?? DEFAULT_ANIMATION.easingUpdate) as never,
      ...option,
    };

    // Apply progressive rendering for large datasets
    if (progressiveRender) {
      (base as Record<string, unknown>).progressive = 200;
      (base as Record<string, unknown>).progressiveThreshold = 200;
    }

    // Apply sampling strategy for data reduction
    if (sampling && Array.isArray(base.series)) {
      base.series = (base.series as Record<string, unknown>[]).map((s) => ({
        ...s,
        sampling,
      }));
    }

    // Apply large mode per series for GPU acceleration
    if (large && Array.isArray(base.series)) {
      base.series = (base.series as Record<string, unknown>[]).map((s) => ({
        ...s,
        large: true,
        largeThreshold: 200,
      }));
    }

    return base;
  }, [option, runtime, large, progressiveRender, sampling]);

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
  // Event handler with selection support (must be before early returns)
  // -------------------------------------------------------------------------
  const onEventsWithSelection = React.useMemo<EChartsReactProps['onEvents']>(() => {
    const existingClick = onEvents?.click;
    return {
      ...onEvents,
      click: (params: unknown) => {
        const payload = params as { name?: string; seriesName?: string };
        if (payload?.name && onDataPointSelect) {
          onDataPointSelect({
            dimension: linkedTableId ?? 'chart',
            value: payload.name,
            series: payload.seriesName,
          });
        }
        if (typeof existingClick === 'function') {
          existingClick(params);
        }
      },
    };
  }, [onEvents, onDataPointSelect, linkedTableId]);

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

  if (!runtime) {
    return (
      <div
        ref={containerRef}
        className={styles.emptyState}
        style={{ height, width, ...style }}
        role="status"
        aria-live="polite"
      >
        Loading chart...
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

  const ReactECharts = runtime.ReactECharts;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ height, width, ...style }}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={ariaDescription ? descriptionId : undefined}
      data-linked-table-id={linkedTableId}
      data-highlight-key={highlightKey ?? undefined}
    >
      {ariaDescription && (
        <p id={descriptionId} style={srOnly}>{ariaDescription}</p>
      )}
      <ReactECharts
        ref={chartRef}
        echarts={runtime.echartsCore as EChartsReactProps['echarts']}
        option={mergedOption}
        theme="hbc"
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
        showLoading={loading}
        loadingOption={loadingOption}
        opts={{ renderer: 'canvas', useDirtyRect: true } as { renderer: 'canvas'; useDirtyRect: boolean }}
        onEvents={onEventsWithSelection}
        onChartReady={onChartReady}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};
