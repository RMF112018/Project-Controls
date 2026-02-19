import type { Meta, StoryObj } from '@storybook/react';
import { EstimatingDashboard } from './EstimatingDashboard';

const meta: Meta<typeof EstimatingDashboard> = {
  title: 'Pages/EstimatingDashboard',
  component: EstimatingDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    initialRoute: '/preconstruction',
  },
};

export default meta;
type Story = StoryObj<typeof EstimatingDashboard>;

export const CurrentPursuits: Story = {
  parameters: {
    initialRoute: '/preconstruction',
  },
};

export const BeforePrompt6Baseline: Story = {
  name: 'Before Prompt 6 Baseline',
  parameters: {
    initialRoute: '/preconstruction',
    docs: {
      description: {
        story: 'Baseline migration state prior to Prompt 6 delight gating and personalization polish.',
      },
    },
  },
};

export const AfterPrompt6DelightEnabled: Story = {
  name: 'After Prompt 6 Delight Enabled',
  parameters: {
    initialRoute: '/preconstruction',
    docs: {
      description: {
        story: 'Prompt 6 enhanced state with motion, synchronized glow cues, and AppContext-backed personalization.',
      },
    },
  },
};

export const PreconTracker: Story = {
  parameters: {
    initialRoute: '/preconstruction/precon-tracker',
  },
};

export const EstimateLog: Story = {
  parameters: {
    initialRoute: '/preconstruction/estimate-log',
  },
};
