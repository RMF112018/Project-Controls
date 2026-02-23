import type { Meta, StoryObj } from '@storybook/react';
import { ProjectHubDashboardPage } from './ProjectHubDashboardPage';

const meta: Meta<typeof ProjectHubDashboardPage> = {
  title: 'Pages/ProjectHub/Dashboard',
  component: ProjectHubDashboardPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/project-hub/dashboard' },
};
export default meta;
type Story = StoryObj<typeof ProjectHubDashboardPage>;

export const Default: Story = {};
