import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { tokens } from '@fluentui/react-components';
import { StatusBadge } from './StatusBadge';

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
    backgroundColor: tokens.colorStatusSuccessForeground1,
    size: 'small',
  },
};

export const NoGoStatus: Story = {
  args: {
    label: 'No-Go',
    color: '#ffffff',
    backgroundColor: tokens.colorStatusDangerForeground1,
    size: 'small',
  },
};

export const ConditionalGo: Story = {
  args: {
    label: 'Conditional Go',
    color: '#ffffff',
    backgroundColor: tokens.colorStatusWarningForeground1,
    size: 'small',
  },
};

export const Active: Story = {
  args: {
    label: 'Active',
    color: '#ffffff',
    backgroundColor: tokens.colorStatusSuccessForeground1,
    size: 'medium',
  },
};

export const Expired: Story = {
  args: {
    label: 'Expired',
    color: '#ffffff',
    backgroundColor: tokens.colorNeutralForeground3,
    size: 'medium',
  },
};

// Show all variants side-by-side
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 16 }}>
      <StatusBadge label="Go" color="#fff" backgroundColor={tokens.colorStatusSuccessForeground1} />
      <StatusBadge label="No-Go" color="#fff" backgroundColor={tokens.colorStatusDangerForeground1} />
      <StatusBadge label="Conditional" color="#fff" backgroundColor={tokens.colorStatusWarningForeground1} />
      <StatusBadge label="Active" color="#fff" backgroundColor={tokens.colorBrandForeground1} />
      <StatusBadge label="Draft" color="#fff" backgroundColor={tokens.colorNeutralForeground3} />
    </div>
  ),
};
