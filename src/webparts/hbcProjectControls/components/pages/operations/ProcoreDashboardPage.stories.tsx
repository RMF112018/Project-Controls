import type { Meta, StoryObj } from '@storybook/react';
import { ProcoreDashboardPage } from './ProcoreDashboardPage';

const meta: Meta<typeof ProcoreDashboardPage> = {
  title: 'Pages/Operations/ProcoreDashboard',
  component: ProcoreDashboardPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/operations/procore' },
};
export default meta;
type Story = StoryObj<typeof ProcoreDashboardPage>;

export const Default: Story = {};
