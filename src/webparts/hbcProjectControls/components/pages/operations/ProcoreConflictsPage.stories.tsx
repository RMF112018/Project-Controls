import type { Meta, StoryObj } from '@storybook/react';
import { ProcoreConflictsPage } from './ProcoreConflictsPage';

const meta: Meta<typeof ProcoreConflictsPage> = {
  title: 'Pages/Operations/ProcoreConflicts',
  component: ProcoreConflictsPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/operations/procore/conflicts' },
};
export default meta;
type Story = StoryObj<typeof ProcoreConflictsPage>;

export const Default: Story = {};
