import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AppLauncher } from './AppLauncher';
import { MockDataService, RoleName } from '@hbc/sp-services';

const meta: Meta<typeof AppLauncher> = {
  title: 'Navigation/AppLauncher',
  component: AppLauncher,
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
            minHeight: 48,
          },
        },
        React.createElement(Story)
      ),
  ],
};
export default meta;
type Story = StoryObj<typeof AppLauncher>;

/**
 * SuperAdmin / Executive Leadership sees all available workspaces.
 * Click the grid icon to open the workspace menu.
 */
const execDs = new MockDataService();
execDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const AllWorkspaces: Story = {
  parameters: {
    dataService: execDs,
  },
};

/**
 * BD Representative sees only workspaces their role permits.
 * Admin and other restricted workspaces are hidden via RoleGate.
 */
const bdDs = new MockDataService();
bdDs.setCurrentUserRole(RoleName.BDRepresentative);

export const LimitedAccess: Story = {
  parameters: {
    dataService: bdDs,
  },
};

/**
 * Operations Team role — mid-level access to operations-focused workspaces.
 */
const opsDs = new MockDataService();
opsDs.setCurrentUserRole(RoleName.OperationsTeam);

export const OperationsTeam: Story = {
  parameters: {
    dataService: opsDs,
  },
};

/**
 * Estimating Coordinator — preconstruction-focused workspace visibility.
 */
const estDs = new MockDataService();
estDs.setCurrentUserRole(RoleName.EstimatingCoordinator);

export const EstimatingCoordinator: Story = {
  parameters: {
    dataService: estDs,
  },
};
