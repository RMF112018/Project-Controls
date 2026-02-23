import type { Meta, StoryObj } from '@storybook/react';
import { ProcoreRFIsPage } from './ProcoreRFIsPage';

const meta: Meta<typeof ProcoreRFIsPage> = {
  title: 'Pages/Operations/ProcoreRFIs',
  component: ProcoreRFIsPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/operations/procore/rfis' },
};
export default meta;
type Story = StoryObj<typeof ProcoreRFIsPage>;

export const Default: Story = {};
