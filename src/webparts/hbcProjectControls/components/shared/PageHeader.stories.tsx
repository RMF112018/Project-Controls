import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'Shared/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Simple: Story = {
  args: {
    title: 'Pipeline Dashboard',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Go/No-Go Scorecard',
    subtitle: 'HBC-2024-001 — Office Tower',
  },
};

export const WithBreadcrumb: Story = {
  args: {
    title: 'Schedule Overview',
    subtitle: 'HBC-2024-003 — Retail Complex',
    breadcrumb: React.createElement(
      'nav',
      { 'aria-label': 'Breadcrumb' },
      React.createElement(
        'ol',
        { style: { display: 'flex', gap: 8, listStyle: 'none', margin: 0, padding: 0, fontSize: 12 } },
        React.createElement('li', null, 'Home'),
        React.createElement('li', null, ' › '),
        React.createElement('li', null, 'Operations'),
        React.createElement('li', null, ' › '),
        React.createElement('li', { 'aria-current': 'page' }, 'Schedule')
      )
    ),
  },
};

export const WithActionSlot: Story = {
  args: {
    title: 'Permits Log',
    subtitle: 'Track and manage project permits',
    actions: React.createElement(
      'div',
      { style: { display: 'flex', gap: 8 } },
      React.createElement(
        'button',
        {
          style: {
            background: '#E87722',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '6px 14px',
            cursor: 'pointer',
          },
        },
        '+ Add Permit'
      ),
      React.createElement(
        'button',
        {
          style: {
            background: 'transparent',
            color: '#1B2A4A',
            border: '1px solid #1B2A4A',
            borderRadius: 4,
            padding: '6px 14px',
            cursor: 'pointer',
          },
        },
        'Export'
      )
    ),
  },
};
