import type { Meta, StoryObj } from '@storybook/react';
import { BambooDirectoryPage } from './BambooDirectoryPage';

const meta: Meta<typeof BambooDirectoryPage> = {
  title: 'Pages/SharedServices/BambooDirectory',
  component: BambooDirectoryPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/shared-services/hr/bamboo/directory' },
};
export default meta;
type Story = StoryObj<typeof BambooDirectoryPage>;

export const Default: Story = {};
