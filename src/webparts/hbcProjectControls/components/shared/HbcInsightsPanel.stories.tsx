import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { HbcInsightsPanel } from './HbcInsightsPanel';

const meta: Meta<typeof HbcInsightsPanel> = {
  title: 'Shared/HbcInsightsPanel',
  component: HbcInsightsPanel,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof HbcInsightsPanel>;

const baseItems = [
  {
    id: 'sync',
    title: 'Portfolio synchronization is healthy',
    description: 'Data freshness and chart-table links are operating normally.',
    severity: 'info' as const,
  },
  {
    id: 'alert',
    title: 'Unbilled value threshold exceeded',
    description: '3 projects exceed the configured unbilled percentage warning threshold.',
    severity: 'warning' as const,
    actionLabel: 'Review projects',
    onAction: () => undefined,
  },
];

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: 'Contextual Insights',
    items: baseItems,
  },
};

export const InteractiveToggle: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Insights</Button>
        <HbcInsightsPanel {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  args: {
    title: 'Insights',
    items: baseItems,
  },
};
