import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { HeaderUserMenu } from './HeaderUserMenu';
import { MockDataService, RoleName } from '@hbc/sp-services';

const meta: Meta<typeof HeaderUserMenu> = {
  title: 'Shared/HeaderUserMenu',
  component: HeaderUserMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'navy' },
  },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        {
          style: {
            backgroundColor: '#1B2A4A',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minWidth: 320,
          },
        },
        React.createElement(Story)
      ),
  ],
};
export default meta;
type Story = StoryObj<typeof HeaderUserMenu>;

/**
 * Default production-like appearance.
 * No dev tools config — shows user persona, version, and What's New link only.
 */
export const Default: Story = {
  args: {
    onWhatsNew: () => console.log('What\'s New clicked'),
  },
};

/**
 * Mock mode with a fresh MockDataService.
 * The global decorator's AppProvider will receive the dataService via parameters.
 * MOCK MODE badge is visible when devToolsConfig is provided by the dev harness
 * (not available in Storybook's AppProvider path — badge shown only in dev server).
 */
const mockDs = new MockDataService();
mockDs.setCurrentUserRole(RoleName.Leadership);

export const MockMode: Story = {
  args: {
    onWhatsNew: () => console.log('What\'s New clicked'),
  },
  parameters: {
    dataService: mockDs,
  },
};

/**
 * BD Representative role — shows a different user persona secondary text.
 */
const bdDs = new MockDataService();
bdDs.setCurrentUserRole(RoleName.BusinessDevelopmentManager);

export const BDRepresentative: Story = {
  args: {
    onWhatsNew: () => console.log('What\'s New clicked'),
  },
  parameters: {
    dataService: bdDs,
  },
};

/**
 * Mobile viewport — persona adapts to smaller screen.
 */
export const MobileView: Story = {
  args: {
    onWhatsNew: () => console.log('What\'s New clicked'),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
