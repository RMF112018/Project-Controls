import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No projects found',
    description: 'No projects match your current filter criteria.',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'No leads available',
    description: 'There are no leads in the pipeline for this period.',
    icon: '📋',
  },
};

export const WithActionButton: Story = {
  args: {
    title: 'No constraints logged',
    description: 'Start tracking constraints by creating your first entry.',
    icon: '⚠️',
    action: React.createElement(
      'button',
      {
        style: {
          background: '#E87722',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 14,
        },
        onClick: () => alert('Add constraint clicked'),
      },
      'Add Constraint'
    ),
  },
};

export const ChartEmpty: Story = {
  args: {
    title: 'No data for selected period',
    description: 'Choose a different date range or project to see chart data.',
    icon: '📊',
  },
};
