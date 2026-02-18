import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { RoleGate } from './RoleGate';
import { MockDataService, RoleName } from '@hbc/sp-services';

const meta: Meta<typeof RoleGate> = {
  title: 'Guards/RoleGate',
  component: RoleGate,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RoleGate>;

// Executive Leadership sees content
const execDs = new MockDataService();
execDs.setCurrentUserRole(RoleName.ExecutiveLeadership);

export const RoleMatches: Story = {
  parameters: { dataService: execDs },
  args: {
    allowedRoles: [RoleName.ExecutiveLeadership, RoleName.IDS],
    children: React.createElement(
      'div',
      { style: { padding: 16, background: '#D1FAE5', borderRadius: 4 } },
      '✅ Content visible — Executive Leadership role has access'
    ),
    fallback: React.createElement(
      'div',
      { style: { padding: 16, color: '#EF4444' } },
      '🚫 Access denied'
    ),
  },
};

// BD Representative does not see content — shows fallback
const bdRepDs = new MockDataService();
bdRepDs.setCurrentUserRole(RoleName.BDRepresentative);

export const RoleBlocked: Story = {
  parameters: { dataService: bdRepDs },
  args: {
    allowedRoles: [RoleName.ExecutiveLeadership],
    children: React.createElement(
      'div',
      { style: { padding: 16, background: '#D1FAE5', borderRadius: 4 } },
      '✅ Content visible'
    ),
    fallback: React.createElement(
      'div',
      { style: { padding: 16, color: '#EF4444', background: '#FEF2F2', borderRadius: 4 } },
      '🚫 Access denied — BD Representative cannot see admin content'
    ),
  },
};
