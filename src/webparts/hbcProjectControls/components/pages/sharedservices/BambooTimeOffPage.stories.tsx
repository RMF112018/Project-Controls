import type { Meta, StoryObj } from '@storybook/react';
import { BambooTimeOffPage } from './BambooTimeOffPage';

const meta: Meta<typeof BambooTimeOffPage> = {
  title: 'Pages/SharedServices/BambooTimeOff',
  component: BambooTimeOffPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/shared-services/hr/bamboo/time-off' },
};
export default meta;
type Story = StoryObj<typeof BambooTimeOffPage>;

export const Default: Story = {};
