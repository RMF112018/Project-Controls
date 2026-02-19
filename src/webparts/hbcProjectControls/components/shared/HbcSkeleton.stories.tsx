import type { Meta, StoryObj } from '@storybook/react';
import { HbcSkeleton } from './HbcSkeleton';

const meta: Meta<typeof HbcSkeleton> = {
  title: 'Shared/HbcSkeleton',
  component: HbcSkeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HbcSkeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
    rows: 3,
  },
};

export const Table: Story = {
  args: {
    variant: 'table',
    rows: 6,
  },
};

export const KpiGrid: Story = {
  args: {
    variant: 'kpi-grid',
    columns: 3,
  },
};

export const Card: Story = {
  args: {
    variant: 'card',
  },
};

export const ReducedMotion: Story = {
  args: {
    variant: 'form',
    rows: 4,
    animated: false,
  },
};
