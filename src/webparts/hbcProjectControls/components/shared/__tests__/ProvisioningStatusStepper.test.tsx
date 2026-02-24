import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import { ProvisioningStatusStepper } from '../ProvisioningStatusStepper';
import type { IProvisioningStepperProps } from '../ProvisioningStatusStepper';
import type { ICompensationResult } from '@hbc/sp-services';

function renderStepper(props: Partial<IProvisioningStepperProps> = {}) {
  const defaultProps: IProvisioningStepperProps = {
    currentStep: 0,
    completedSteps: [],
    stepStatus: 'pending',
    ...props,
  };
  return render(
    <FluentProvider theme={teamsLightTheme}>
      <ProvisioningStatusStepper {...defaultProps} />
    </FluentProvider>
  );
}

describe('ProvisioningStatusStepper', () => {
  it('renders all 7 provisioning steps', () => {
    renderStepper();
    const steps = screen.getAllByLabelText(/^Step \d:/);
    expect(steps).toHaveLength(7);
  });

  it('renders step labels correctly', () => {
    renderStepper();
    expect(screen.getByLabelText(/Step 1: Create SharePoint Site/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 7: Update Leads_Master/)).toBeInTheDocument();
  });

  it('shows pending state for all steps initially', () => {
    renderStepper();
    const steps = screen.getAllByLabelText(/pending$/);
    expect(steps).toHaveLength(7);
  });

  it('shows active state for current step', () => {
    renderStepper({ currentStep: 3, completedSteps: [1, 2], stepStatus: 'in_progress' });
    const activeStep = screen.getByLabelText(/Step 3:.*active/);
    expect(activeStep).toBeInTheDocument();
  });

  it('shows completed state for completed steps', () => {
    renderStepper({ currentStep: 4, completedSteps: [1, 2, 3], stepStatus: 'in_progress' });
    const completedSteps = screen.getAllByLabelText(/completed$/);
    expect(completedSteps).toHaveLength(3);
  });

  it('shows failed state for failed step', () => {
    renderStepper({ currentStep: 3, completedSteps: [1, 2], failedStep: 3, stepStatus: 'failed' });
    const failedStep = screen.getByLabelText(/Step 3:.*failed/);
    expect(failedStep).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows compensating state', () => {
    renderStepper({ currentStep: 2, completedSteps: [1, 2], stepStatus: 'compensating' });
    const compensatingStep = screen.getByLabelText(/Step 2:.*compensating/);
    expect(compensatingStep).toBeInTheDocument();
  });

  it('displays compensation results', () => {
    const compensationResults: ICompensationResult[] = [
      { step: 2, label: 'Apply PnP Template', success: true, duration: 120, timestamp: new Date().toISOString() },
      { step: 1, label: 'Create SharePoint Site', success: false, error: 'Delete failed', duration: 250, timestamp: new Date().toISOString() },
    ];
    renderStepper({
      currentStep: 3,
      completedSteps: [1, 2],
      failedStep: 3,
      stepStatus: 'failed',
      compensationResults,
    });
    expect(screen.getByText(/Rolled back/)).toBeInTheDocument();
    expect(screen.getByText(/120ms/)).toBeInTheDocument();
    expect(screen.getByText(/Rollback failed: Delete failed/)).toBeInTheDocument();
  });

  it('sets aria-current="step" on active step', () => {
    renderStepper({ currentStep: 2, completedSteps: [1], stepStatus: 'in_progress' });
    const activeStep = screen.getByLabelText(/Step 2:.*active/);
    expect(activeStep).toHaveAttribute('aria-current', 'step');
  });

  it('does not set aria-current on non-active steps', () => {
    renderStepper({ currentStep: 2, completedSteps: [1], stepStatus: 'in_progress' });
    const pendingStep = screen.getByLabelText(/Step 3:.*pending/);
    expect(pendingStep).not.toHaveAttribute('aria-current');
  });

  it('applies custom className', () => {
    const { container } = renderStepper({ className: 'my-custom-class' });
    // FluentProvider wraps the stepper, so query inside the container
    const stepperRoot = container.querySelector('.my-custom-class');
    expect(stepperRoot).toBeInTheDocument();
  });
});
