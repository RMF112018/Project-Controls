import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Add24Regular } from '@fluentui/react-icons';
import { HbcButton } from './HbcButton';

const meta: Meta<typeof HbcButton> = {
  title: 'Shared/HbcButton',
  component: HbcButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HbcButton>;

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const Strong: Story = {
  args: {
    children: 'Strong',
    emphasis: 'strong',
  },
};

export const Subtle: Story = {
  args: {
    children: 'Subtle',
    emphasis: 'subtle',
  },
};

export const Loading: Story = {
  args: {
    children: 'Saving',
    isLoading: true,
  },
};

export const IconOnly: Story = {
  args: {
    icon: React.createElement(Add24Regular),
    iconOnlyLabel: 'Create item',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};
