import type { Meta, StoryObj } from '@storybook/react';
import { MonthlyProjectReview } from './MonthlyProjectReview';

const meta: Meta<typeof MonthlyProjectReview> = {
  title: 'Pages/MonthlyProjectReview',
  component: MonthlyProjectReview,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    initialRoute: '/operations/monthly-review',
  },
};
export default meta;
type Story = StoryObj<typeof MonthlyProjectReview>;

export const Default: Story = {};
