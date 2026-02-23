import type { Meta, StoryObj } from '@storybook/react';
import { BambooOrgChartPage } from './BambooOrgChartPage';

const meta: Meta<typeof BambooOrgChartPage> = {
  title: 'Pages/SharedServices/BambooOrgChart',
  component: BambooOrgChartPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/shared-services/hr/bamboo/org-chart' },
};
export default meta;
type Story = StoryObj<typeof BambooOrgChartPage>;

export const Default: Story = {};
