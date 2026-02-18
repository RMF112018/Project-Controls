import type { Meta, StoryObj } from '@storybook/react';
import { BuyoutLogPage } from './BuyoutLogPage';

const meta: Meta<typeof BuyoutLogPage> = {
  title: 'Pages/BuyoutLogPage',
  component: BuyoutLogPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    initialRoute: '/operations/buyout-log',
  },
};
export default meta;
type Story = StoryObj<typeof BuyoutLogPage>;

export const Default: Story = {};
