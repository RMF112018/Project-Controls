import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { HbcEChart } from './HbcEChart';

const meta: Meta<typeof HbcEChart> = {
  title: 'Shared/HbcEChart',
  component: HbcEChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof HbcEChart>;

// Always useMemo for EChartsOption — matches production pattern
const BarChartStory = () => {
  const option = useMemo<EChartsOption>(() => ({
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] },
    yAxis: { type: 'value' },
    series: [{ data: [12, 19, 3, 5, 8], type: 'bar', name: 'Leads' }],
  }), []);
  return <HbcEChart option={option} height={320} ariaLabel="Monthly lead count bar chart" />;
};

export const BarChart: Story = { render: () => <BarChartStory /> };

const DonutStory = () => {
  const option = useMemo<EChartsOption>(() => ({
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 12, name: 'Go' },
        { value: 4, name: 'No-Go' },
        { value: 3, name: 'Conditional' },
      ],
    }],
  }), []);
  return <HbcEChart option={option} height={320} ariaLabel="Go/No-Go decision donut chart" />;
};

export const DonutChart: Story = { render: () => <DonutStory /> };

export const LoadingState: Story = {
  args: { option: {}, height: 320, loading: true, ariaLabel: 'Loading chart' },
};

export const EmptyState: Story = {
  args: { option: {}, height: 320, empty: true, emptyMessage: 'No data for this period', ariaLabel: 'Empty chart' },
};

// Real-time SignalR update simulation — tests ARIA live region + smooth transition
// WCAG 2.2 AA: dynamic chart updates must not flash (hbcEChartsTheme animationDurationUpdate: 300ms)
const RealTimeStory = () => {
  const [data, setData] = React.useState([12, 19, 3, 5, 8]);
  React.useEffect(() => {
    const interval = setTimeout(() => setData([18, 24, 7, 11, 15]), 2000);
    return () => clearTimeout(interval);
  }, []);
  const option = useMemo<EChartsOption>(() => ({
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    yAxis: { type: 'value' },
    series: [{ data, type: 'bar', name: 'Daily Submittals' }],
  }), [data]);
  return (
    <div aria-live="polite" aria-label="Daily submittals chart — updates in real time">
      <HbcEChart option={option} height={320} ariaLabel="Daily submittals bar chart" />
    </div>
  );
};

export const RealTimeUpdate: Story = { render: () => <RealTimeStory /> };
