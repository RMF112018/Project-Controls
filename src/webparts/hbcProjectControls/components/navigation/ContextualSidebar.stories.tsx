import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { ContextualSidebar } from './ContextualSidebar';
import { MockDataService, RoleName } from '@hbc/sp-services';

const meta: Meta<typeof ContextualSidebar> = {
  title: 'Navigation/ContextualSidebar',
  component: ContextualSidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        {
          style: {
            width: 260,
            height: '100vh',
            borderRight: '1px solid #e5e7eb',
          },
        },
        React.createElement(Story)
      ),
  ],
};
export default meta;
type Story = StoryObj<typeof ContextualSidebar>;

/**
 * Preconstruction workspace sidebar.
 * Uses initialRoute to set the pathname so useWorkspace() derives the correct workspace.
 * Shows BD, Estimating, IDS, and other preconstruction sidebar groups.
 */
const preconDs = new MockDataService();
preconDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const Preconstruction: Story = {
  parameters: {
    initialRoute: '/preconstruction',
    dataService: preconDs,
  },
};

/**
 * Operations workspace sidebar.
 * Shows Commercial Ops, Logs & Reports, Safety, QC, Procore groups.
 */
const opsDs = new MockDataService();
opsDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const Operations: Story = {
  parameters: {
    initialRoute: '/operations',
    dataService: opsDs,
  },
};

/**
 * Admin workspace sidebar — SuperAdmin role required for full visibility.
 * Shows System Config, Security & Access, Provisioning, Dev Tools groups.
 */
const adminDs = new MockDataService();
adminDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const Admin: Story = {
  parameters: {
    initialRoute: '/admin',
    dataService: adminDs,
  },
};

/**
 * Shared Services workspace sidebar.
 * Shows Marketing, HR, Accounting, Risk Management, BambooHR groups.
 */
const sharedDs = new MockDataService();
sharedDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const SharedServices: Story = {
  parameters: {
    initialRoute: '/shared-services',
    dataService: sharedDs,
  },
};
