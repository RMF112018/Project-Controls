/**
 * Jest mock for echarts-for-react.
 * Renders a lightweight div instead of a canvas — no real ECharts rendering in tests.
 */
import * as React from 'react';

interface MockEChartsProps {
  option?: {
    series?: Array<{ type?: string }>;
    [key: string]: unknown;
  };
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const ReactEChartsMock = React.forwardRef<HTMLDivElement, MockEChartsProps>(
  ({ option, style }, ref) => {
    const chartType = option?.series?.[0]?.type ?? 'unknown';
    return (
      <div
        ref={ref}
        data-testid="echarts-mock"
        data-chart-type={chartType}
        style={style}
      />
    );
  }
);

ReactEChartsMock.displayName = 'ReactEChartsMock';

export default ReactEChartsMock;
