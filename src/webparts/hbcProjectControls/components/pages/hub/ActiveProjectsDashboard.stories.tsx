import type { Meta, StoryObj } from '@storybook/react';
import { ActiveProjectsDashboard } from './ActiveProjectsDashboard';

const meta: Meta<typeof ActiveProjectsDashboard> = {
  title: 'Pages/ActiveProjectsDashboard',
  component: ActiveProjectsDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    initialRoute: '/operations',
  },
};

export default meta;
type Story = StoryObj<typeof ActiveProjectsDashboard>;

export const Default: Story = {
  parameters: {
    initialRoute: '/operations',
  },
};

export const BeforePrompt6Baseline: Story = {
  name: 'Before Prompt 6 Baseline',
  parameters: {
    initialRoute: '/operations',
    docs: {
      description: {
        story: 'Baseline migration state prior to Prompt 6 delight and contextual insights integration.',
      },
    },
  },
};

export const AfterPrompt6DelightEnabled: Story = {
  name: 'After Prompt 6 Delight Enabled',
  parameters: {
    initialRoute: '/operations',
    docs: {
      description: {
        story: 'Prompt 6 enhanced state with synchronized visualization feedback, motion polish, and personalization.',
      },
    },
  },
};
