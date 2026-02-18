import type { Meta, StoryObj } from '@storybook/react';
import { NavigationSidebar } from './NavigationSidebar';
import { MockDataService, RoleName } from '@hbc/sp-services';

const meta: Meta<typeof NavigationSidebar> = {
  title: 'Layouts/NavigationSidebar',
  component: NavigationSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;
type Story = StoryObj<typeof NavigationSidebar>;

// Executive Leadership — all nav groups visible
const execDs = new MockDataService();
execDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const ExecutiveLeadership: Story = {
  parameters: { dataService: execDs, initialRoute: '/' },
};

// BD Representative — Preconstruction nav only
const bdRepDs = new MockDataService();
bdRepDs.setCurrentUserRole(RoleName.BDRepresentative);

export const BDRepresentative: Story = {
  parameters: { dataService: bdRepDs, initialRoute: '/' },
};

// Operations Team — Project nav visible
const opsDs = new MockDataService();
opsDs.setCurrentUserRole(RoleName.OperationsTeam);

export const OperationsTeam: Story = {
  parameters: { dataService: opsDs, initialRoute: '/' },
};
