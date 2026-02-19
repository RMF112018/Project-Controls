import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert24Regular } from '@fluentui/react-icons';
import { HbcButton } from './HbcButton';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/EmptyState (Legacy Bridge)',
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
    icon: React.createElement(Alert24Regular),
  },
};

export const WithActionButton: Story = {
  args: {
    title: 'No constraints logged',
    description: 'Start tracking constraints by creating your first entry.',
    action: React.createElement(HbcButton, { emphasis: 'strong' }, 'Add Constraint'),
  },
};
