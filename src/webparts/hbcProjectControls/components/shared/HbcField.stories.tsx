import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@fluentui/react-components';
import { HbcField } from './HbcField';

const meta: Meta<typeof HbcField> = {
  title: 'Shared/HbcField',
  component: HbcField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HbcField>;

export const Basic: Story = {
  args: {
    label: 'Project Name',
    children: React.createElement(Input, { defaultValue: 'Hudson Tower' }),
  },
};

export const Required: Story = {
  args: {
    label: 'Project Code',
    required: true,
    children: React.createElement(Input, { defaultValue: 'PRJ-2048' }),
  },
};

export const WithHint: Story = {
  args: {
    label: 'Owner Representative',
    hint: 'Use corporate email if available.',
    children: React.createElement(Input),
  },
};

export const WithError: Story = {
  args: {
    label: 'Budget',
    validationMessage: 'Budget must be greater than zero.',
    children: React.createElement(Input, { value: '0' }),
  },
};

export const HorizontalLayout: Story = {
  args: {
    label: 'Permit Number',
    orientation: 'horizontal',
    children: React.createElement(Input, { defaultValue: 'PMT-0182' }),
  },
};
