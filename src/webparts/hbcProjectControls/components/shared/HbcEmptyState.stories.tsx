import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert24Regular, ArrowReset24Regular } from '@fluentui/react-icons';
import { HbcEmptyState } from './HbcEmptyState';

const meta: Meta<typeof HbcEmptyState> = {
  title: 'Shared/HbcEmptyState',
  component: HbcEmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HbcEmptyState>;

export const Basic: Story = {
  args: {
    title: 'No records found',
    description: 'This view has no data yet for the selected project scope.',
  },
};

export const WithPrimaryAction: Story = {
  args: {
    title: 'No permits logged',
    description: 'Start by creating your first permit request.',
    icon: React.createElement(Alert24Regular),
    actions: [
      {
        id: 'create',
        label: 'Create Permit',
        appearance: 'primary',
        onClick: () => undefined,
      },
    ],
  },
};

export const ContextualActions: Story = {
  args: {
    title: 'No matching constraints',
    description: 'Adjust your filters or clear search to broaden results.',
    actions: [
      {
        id: 'clear',
        label: 'Clear Filters',
        appearance: 'secondary',
        icon: React.createElement(ArrowReset24Regular),
        onClick: () => undefined,
        priority: 1,
      },
      {
        id: 'new',
        label: 'Add Constraint',
        appearance: 'primary',
        onClick: () => undefined,
        priority: 0,
      },
    ],
    contextKey: 'constraints-filtered',
  },
};

export const PermissionLimitedActions: Story = {
  args: {
    title: 'No administrative actions available',
    description: 'Your current role does not allow modifying this configuration.',
    actions: [
      {
        id: 'request',
        label: 'Request Access',
        appearance: 'secondary',
        onClick: () => undefined,
        isVisible: () => true,
      },
      {
        id: 'admin',
        label: 'Open Admin Panel',
        appearance: 'primary',
        onClick: () => undefined,
        isVisible: () => false,
      },
    ],
  },
};
