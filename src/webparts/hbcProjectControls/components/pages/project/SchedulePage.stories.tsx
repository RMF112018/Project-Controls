import type { Meta, StoryObj } from '@storybook/react';
import { SchedulePage } from './SchedulePage';

const meta: Meta<typeof SchedulePage> = {
  title: 'Pages/SchedulePage',
  component: SchedulePage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SchedulePage>;

export const Overview: Story = {
  parameters: { initialRoute: '/operations/schedule' },
};

export const GanttTab: Story = {
  parameters: { initialRoute: '/operations/schedule?tab=gantt' },
};
