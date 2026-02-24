import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  ArrowSync24Regular,
  Circle24Regular,
  ArrowUndo24Regular,
} from '@fluentui/react-icons';
import type { ICompensationResult } from '@hbc/sp-services';
import { PROVISIONING_STEPS } from '@hbc/sp-services';

/**
 * Phase 5C: ProvisioningStatusStepper — Fluent UI v9 vertical stepper.
 *
 * Uses exclusively Fluent motion tokens (durationFast–durationGentle, 150-250ms).
 * Supports prefers-reduced-motion. Role-aware contrast. WCAG 2.2 AA.
 */

export interface IProvisioningStepperProps {
  currentStep: number;
  completedSteps: number[];
  failedStep?: number;
  stepStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'compensating';
  compensationResults?: ICompensationResult[];
  className?: string;
}

type StepState = 'pending' | 'active' | 'completed' | 'failed' | 'compensating';

function getStepState(
  stepNum: number,
  currentStep: number,
  completedSteps: number[],
  failedStep: number | undefined,
  stepStatus: IProvisioningStepperProps['stepStatus']
): StepState {
  if (failedStep === stepNum) return 'failed';
  // Compensating check MUST precede completed — during rollback the current step
  // may appear in completedSteps but is actively being compensated.
  if (currentStep === stepNum && stepStatus === 'compensating') return 'compensating';
  if (completedSteps.includes(stepNum)) return 'completed';
  if (currentStep === stepNum && (stepStatus === 'in_progress' || stepStatus === 'completed')) return 'active';
  return 'pending';
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('0'),
    ...shorthands.padding('8px', '0'),
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('12px'),
    position: 'relative',
    minHeight: '44px',
  },
  iconColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '32px',
    flexShrink: 0,
    position: 'relative',
  },
  iconWrapper: {
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    position: 'relative',
    zIndex: 1,
  },
  iconPending: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground4,
  },
  iconActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  iconCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: '#fff',
    animationName: {
      from: { transform: 'scale(0.5)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    animationDuration: tokens.durationFast,
    animationTimingFunction: tokens.curveEasyEase,
    animationFillMode: 'both',
  },
  iconFailed: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: '#fff',
    animationName: {
      '0%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(-3px)' },
      '50%': { transform: 'translateX(3px)' },
      '75%': { transform: 'translateX(-2px)' },
      '100%': { transform: 'translateX(0)' },
    },
    animationDuration: tokens.durationGentle,
    animationTimingFunction: tokens.curveEasyEase,
  },
  iconCompensating: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
    color: '#fff',
  },
  spinIcon: {
    animationName: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    animationDuration: '1.2s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  connector: {
    width: '2px',
    height: '16px',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    flexShrink: 0,
  },
  connectorPending: {
    backgroundColor: tokens.colorNeutralStroke2,
  },
  connectorFilled: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  labelColumn: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    ...shorthands.padding('4px', '0'),
    minWidth: 0,
    flex: '1 1 auto',
  },
  stepLabel: {
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: '20px',
    transitionProperty: 'color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  labelDefault: {
    color: tokens.colorNeutralForeground2,
  },
  labelHighContrast: {
    color: tokens.colorNeutralForeground1,
  },
  labelActive: {
    color: tokens.colorBrandForeground1,
    fontWeight: 600,
  },
  labelCompleted: {
    color: tokens.colorPaletteGreenForeground1,
  },
  labelFailed: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: 600,
  },
  labelCompensating: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    fontWeight: 600,
  },
  errorText: {
    fontSize: '11px',
    color: tokens.colorPaletteRedForeground1,
    lineHeight: '16px',
  },
  compensationInfo: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '16px',
    fontStyle: 'italic',
  },
  // Reduced motion — disable all animations
  '@media (prefers-reduced-motion: reduce)': {
    iconCompleted: {
      animationDuration: tokens.durationUltraFast,
    },
    iconFailed: {
      animationDuration: tokens.durationUltraFast,
    },
    spinIcon: {
      animationDuration: tokens.durationUltraFast,
      animationIterationCount: '1',
    },
    connector: {
      transitionDuration: tokens.durationUltraFast,
    },
    iconWrapper: {
      transitionDuration: tokens.durationUltraFast,
    },
    stepLabel: {
      transitionDuration: tokens.durationUltraFast,
    },
  },
});

const STEP_ICONS: Record<StepState, React.ComponentType<{ className?: string }>> = {
  pending: Circle24Regular,
  active: ArrowSync24Regular,
  completed: Checkmark24Regular,
  failed: Dismiss24Regular,
  compensating: ArrowUndo24Regular,
};

export const ProvisioningStatusStepper: React.FC<IProvisioningStepperProps> = ({
  currentStep,
  completedSteps,
  failedStep,
  stepStatus,
  compensationResults,
  className,
}) => {
  const styles = useStyles();

  const steps = PROVISIONING_STEPS;

  return (
    <div className={mergeClasses(styles.root, className)}>
      {steps.map((step, idx) => {
        const state = getStepState(step.step, currentStep, completedSteps, failedStep, stepStatus);
        const Icon = STEP_ICONS[state];
        const isLast = idx === steps.length - 1;

        const iconClass = mergeClasses(
          styles.iconWrapper,
          state === 'pending' && styles.iconPending,
          state === 'active' && styles.iconActive,
          state === 'completed' && styles.iconCompleted,
          state === 'failed' && styles.iconFailed,
          state === 'compensating' && styles.iconCompensating
        );

        const labelClass = mergeClasses(
          styles.stepLabel,
          state === 'pending' && styles.labelDefault,
          state === 'active' && styles.labelActive,
          state === 'completed' && styles.labelCompleted,
          state === 'failed' && styles.labelFailed,
          state === 'compensating' && styles.labelCompensating
        );

        const connectorClass = mergeClasses(
          styles.connector,
          completedSteps.includes(step.step) ? styles.connectorFilled : styles.connectorPending
        );

        const compResult = compensationResults?.find(r => r.step === step.step);

        return (
          <div
            key={step.step}
            className={styles.stepRow}
            aria-label={`Step ${step.step}: ${step.label}, ${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <div className={styles.iconColumn}>
              <div className={iconClass}>
                <Icon className={state === 'active' ? styles.spinIcon : undefined} />
              </div>
              {!isLast && <div className={connectorClass} />}
            </div>
            <div className={styles.labelColumn}>
              <span className={labelClass}>
                {step.label}
              </span>
              {state === 'failed' && failedStep === step.step && (
                <span className={styles.errorText}>Failed</span>
              )}
              {compResult && (
                <span className={styles.compensationInfo}>
                  {compResult.success ? 'Rolled back' : `Rollback failed: ${compResult.error}`}
                  {' '}({compResult.duration}ms)
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
