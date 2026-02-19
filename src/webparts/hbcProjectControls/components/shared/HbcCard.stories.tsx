import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@fluentui/react-components';
import { HbcButton } from './HbcButton';
import { HbcCard } from './HbcCard';
import { HbcSkeleton } from './HbcSkeleton';

const meta: Meta<typeof HbcCard> = {
  title: 'Shared/HbcCard',
  component: HbcCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HbcCard>;

export const Basic: Story = {
  args: {
    title: 'Project Snapshot',
    subtitle: 'Updated 4 minutes ago',
    children: 'Current production and safety metrics are healthy for this milestone.',
  },
};

export const Interactive: Story = {
  args: {
    title: 'Open Dashboard',
    subtitle: 'Navigation card',
    interactive: true,
    children: 'Use Enter/Space to activate keyboard interaction.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Buyout Status',
    headerActions: React.createElement(HbcButton, { emphasis: 'subtle' }, 'Review'),
    children: 'Six contracts pending final legal review.',
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Permit Queue',
    footer: React.createElement(HbcButton, null, 'View queue'),
    children: 'Three permit applications need owner signatures.',
  },
};

export const LoadingContent: Story = {
  args: {
    title: 'Constraints Log',
    statusBadge: React.createElement(Badge, { appearance: 'outline' }, 'Loading'),
    children: React.createElement(HbcSkeleton, { variant: 'text', rows: 4 }),
  },
};
