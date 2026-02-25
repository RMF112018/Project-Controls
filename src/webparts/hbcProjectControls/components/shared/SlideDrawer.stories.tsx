import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { SlideDrawer } from './SlideDrawer';

const meta: Meta<typeof SlideDrawer> = {
  title: 'Shared/SlideDrawer',
  component: SlideDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SlideDrawer>;

/**
 * Open drawer with a simple title and minimal form content.
 */
export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Drawer closed'),
    title: 'Edit Template',
    children: React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      React.createElement(
        'label',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600 } },
        'Template Name',
        React.createElement('input', {
          type: 'text',
          defaultValue: 'Default',
          style: {
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
          },
        })
      ),
      React.createElement(
        'label',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600 } },
        'Description',
        React.createElement('input', {
          type: 'text',
          defaultValue: 'Standard project site template',
          style: {
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
          },
        })
      )
    ),
  },
};

/**
 * Closed state — renders null, nothing visible.
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Drawer closed'),
    title: 'Edit Template',
    children: React.createElement('div', null, 'This content is not visible when closed.'),
  },
};

/**
 * Wider drawer with a more detailed form for creating a new entry.
 */
export const WithForm: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Drawer closed'),
    title: 'Create New Entry',
    width: 500,
    children: React.createElement(
      'form',
      {
        style: { display: 'flex', flexDirection: 'column', gap: '16px' },
        onSubmit: (e: React.FormEvent) => { e.preventDefault(); console.log('Form submitted'); },
      },
      React.createElement(
        'label',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600 } },
        'Project Name',
        React.createElement('input', {
          type: 'text',
          placeholder: 'Enter project name',
          style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' },
        })
      ),
      React.createElement(
        'label',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600 } },
        'Project Code',
        React.createElement('input', {
          type: 'text',
          placeholder: 'e.g. HBC-2026-001',
          style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' },
        })
      ),
      React.createElement(
        'label',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600 } },
        'Template Type',
        React.createElement(
          'select',
          { style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' } },
          React.createElement('option', { value: 'Default' }, 'Default'),
          React.createElement('option', { value: 'Commercial' }, 'Commercial'),
          React.createElement('option', { value: 'Luxury Residential' }, 'Luxury Residential')
        )
      ),
      React.createElement(
        'label',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600 } },
        'Notes',
        React.createElement('textarea', {
          rows: 4,
          placeholder: 'Additional notes...',
          style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' as const },
        })
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' } },
        React.createElement(
          'button',
          {
            type: 'button',
            style: { padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' },
          },
          'Cancel'
        ),
        React.createElement(
          'button',
          {
            type: 'submit',
            style: { padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#1B2A4A', color: '#fff', cursor: 'pointer' },
          },
          'Create'
        )
      )
    ),
  },
};

/**
 * Drawer with extensive scrollable content to verify overflow behavior.
 */
export const LargeContent: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Drawer closed'),
    title: 'Template Details',
    children: React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      ...Array.from({ length: 12 }, (_, i) =>
        React.createElement(
          'div',
          { key: i, style: { padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' } },
          React.createElement('h4', { style: { margin: '0 0 8px 0', color: '#1B2A4A' } }, `Section ${i + 1}`),
          React.createElement(
            'p',
            { style: { margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' } },
            `This is a detailed section of template configuration. It contains settings, descriptions, and parameters for the provisioning process. ` +
            `Step ${i + 1} of the template includes hub association settings, security group assignments, and document library configurations.`
          )
        )
      )
    ),
  },
};
