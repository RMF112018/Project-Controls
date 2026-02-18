import type { Meta, StoryObj } from '@storybook/react';
import { KPICard } from './KPICard';

const meta: Meta<typeof KPICard> = {
  title: 'Shared/KPICard',
  component: KPICard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof KPICard>;

export const Default: Story = {
  args: { title: 'Active Projects', value: 24, subtitle: 'Across all regions' },
};

export const WithPositiveTrend: Story = {
  args: {
    title: 'Win Rate',
    value: '68%',
    subtitle: 'YTD',
    trend: { value: 4, isPositive: true },
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Cost Variance',
    value: '-$42K',
    trend: { value: -8, isPositive: false },
  },
};

export const WithDrillDown: Story = {
  args: {
    title: 'Revenue Pipeline',
    value: '$12.4M',
    subtitle: 'Q1 2026',
    onClick: () => { /* opens drillDown SlideDrawer */ },
  },
};
