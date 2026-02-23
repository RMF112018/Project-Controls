import type { Meta, StoryObj } from '@storybook/react';
import { ProjectHubSettingsPage } from './ProjectHubSettingsPage';

const meta: Meta<typeof ProjectHubSettingsPage> = {
  title: 'Pages/ProjectHub/Settings',
  component: ProjectHubSettingsPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/project-hub/settings' },
};
export default meta;
type Story = StoryObj<typeof ProjectHubSettingsPage>;

export const Default: Story = {};
