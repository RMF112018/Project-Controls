import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { FeatureGate } from './FeatureGate';
import { MockDataService } from '@hbc/sp-services';

const meta: Meta<typeof FeatureGate> = {
  title: 'Guards/FeatureGate',
  component: FeatureGate,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FeatureGate>;

// Feature enabled — MockDataService.getFeatureFlags() returns ScheduleModule enabled by default
const enabledDs = new MockDataService();

export const FeatureEnabled: Story = {
  parameters: { dataService: enabledDs },
  args: {
    featureName: 'ScheduleModule',
    children: React.createElement(
      'p',
      { style: { padding: 12, background: '#D1FAE5', borderRadius: 4 } },
      '✅ Schedule Module is enabled — content renders'
    ),
    fallback: React.createElement('p', null, '🚫 Feature disabled'),
  },
};

export const FeatureDisabled: Story = {
  parameters: { dataService: enabledDs },
  args: {
    featureName: 'NonExistentFeature',
    children: React.createElement('p', null, '✅ Content visible'),
    fallback: React.createElement(
      'p',
      { style: { padding: 12, background: '#FEF3C7', borderRadius: 4 } },
      '⚠️ Feature not enabled — fallback rendered'
    ),
  },
};
