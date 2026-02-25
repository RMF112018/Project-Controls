import type { Meta, StoryObj, Decorator } from '@storybook/react';
import * as React from 'react';
import { ProvisioningStatusStepper } from './ProvisioningStatusStepper';
import type { ICompensationResult } from '@hbc/sp-services';

const meta: Meta<typeof ProvisioningStatusStepper> = {
  title: 'Shared/ProvisioningStatusStepper',
  component: ProvisioningStatusStepper,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { style: { maxWidth: 420, margin: '0 auto' } },
        React.createElement(Story)
      ),
  ],
};
export default meta;
type Story = StoryObj<typeof ProvisioningStatusStepper>;

/**
 * Active provisioning — Step 3 is in progress, steps 1-2 completed.
 */
export const InProgress: Story = {
  args: {
    currentStep: 3,
    completedSteps: [1, 2],
    stepStatus: 'in_progress',
  },
};

/**
 * All 7 steps completed successfully.
 */
export const Completed: Story = {
  args: {
    currentStep: 7,
    completedSteps: [1, 2, 3, 4, 5, 6, 7],
    stepStatus: 'completed',
  },
};

/**
 * Provisioning failed at step 4 — steps 1-3 completed, step 4 shows error.
 */
export const Failed: Story = {
  args: {
    currentStep: 4,
    completedSteps: [1, 2, 3],
    failedStep: 4,
    stepStatus: 'failed',
  },
};

/**
 * Compensation (rollback) in progress — steps 5-3 rolling back in reverse order.
 * Demonstrates the saga compensation pattern with mixed success/failure results.
 */
const compensationResults: ICompensationResult[] = [
  {
    step: 5,
    label: 'Apply GitOps Template',
    success: true,
    duration: 320,
    timestamp: new Date().toISOString(),
  },
  {
    step: 4,
    label: 'Security Groups & Members',
    success: true,
    duration: 540,
    timestamp: new Date().toISOString(),
  },
  {
    step: 3,
    label: 'Hub Association',
    success: false,
    error: 'Failed to disassociate from hub site — manual intervention required',
    duration: 1200,
    timestamp: new Date().toISOString(),
  },
];

export const Compensating: Story = {
  args: {
    currentStep: 3,
    completedSteps: [1, 2, 3, 4, 5],
    stepStatus: 'compensating',
    compensationResults,
  },
};

/**
 * Reduced motion variant — same as InProgress but with an a11y decorator
 * that injects prefers-reduced-motion: reduce for testing motion accessibility.
 */
const reducedMotionDecorator: Decorator = (Story) =>
  React.createElement(
    React.Fragment,
    null,
    React.createElement('style', null, `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    `),
    React.createElement(Story)
  );

export const ReducedMotion: Story = {
  args: {
    currentStep: 3,
    completedSteps: [1, 2],
    stepStatus: 'in_progress',
  },
  decorators: [reducedMotionDecorator],
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
};
