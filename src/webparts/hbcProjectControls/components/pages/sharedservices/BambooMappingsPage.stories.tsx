import type { Meta, StoryObj } from '@storybook/react';
import { BambooMappingsPage } from './BambooMappingsPage';

const meta: Meta<typeof BambooMappingsPage> = {
  title: 'Pages/SharedServices/BambooMappings',
  component: BambooMappingsPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/shared-services/hr/bamboo/mappings' },
};
export default meta;
type Story = StoryObj<typeof BambooMappingsPage>;

export const Default: Story = {};
