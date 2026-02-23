import type { Meta, StoryObj } from '@storybook/react';
import { ProcoreBudgetPage } from './ProcoreBudgetPage';

const meta: Meta<typeof ProcoreBudgetPage> = {
  title: 'Pages/Operations/ProcoreBudget',
  component: ProcoreBudgetPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', initialRoute: '/operations/procore/budget' },
};
export default meta;
type Story = StoryObj<typeof ProcoreBudgetPage>;

export const Default: Story = {};
