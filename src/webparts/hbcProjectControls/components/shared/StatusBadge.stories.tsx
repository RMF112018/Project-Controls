import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { StatusBadge } from './StatusBadge';
import { HBC_COLORS } from '../../theme/tokens';

const meta: Meta<typeof StatusBadge> = {
  title: 'Shared/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const GoStatus: Story = {
  args: {
    label: 'Go',
    color: '#ffffff',
    backgroundColor: HBC_COLORS.success,
    size: 'small',
  },
};

export const NoGoStatus: Story = {
  args: {
    label: 'No-Go',
    color: '#ffffff',
    backgroundColor: HBC_COLORS.error,
    size: 'small',
  },
};

export const ConditionalGo: Story = {
  args: {
    label: 'Conditional Go',
    color: '#ffffff',
    backgroundColor: HBC_COLORS.warning,
    size: 'small',
  },
};

export const Active: Story = {
  args: {
    label: 'Active',
    color: '#ffffff',
    backgroundColor: HBC_COLORS.success,
    size: 'medium',
  },
};

export const Expired: Story = {
  args: {
    label: 'Expired',
    color: '#ffffff',
    backgroundColor: HBC_COLORS.gray400,
    size: 'medium',
  },
};

// Show all variants side-by-side
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 16 }}>
      <StatusBadge label="Go" color="#fff" backgroundColor={HBC_COLORS.success} />
      <StatusBadge label="No-Go" color="#fff" backgroundColor={HBC_COLORS.error} />
      <StatusBadge label="Conditional" color="#fff" backgroundColor={HBC_COLORS.warning} />
      <StatusBadge label="Active" color="#fff" backgroundColor={HBC_COLORS.info} />
      <StatusBadge label="Draft" color="#fff" backgroundColor={HBC_COLORS.gray400} />
    </div>
  ),
};
