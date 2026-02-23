import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('48px'),
    textAlign: 'center',
  },
  heading: {
    ...shorthands.margin('0', '0', '8px', '0'),
    color: HBC_COLORS.navy,
    fontSize: '18px',
    fontWeight: '600',
  },
  description: {
    ...shorthands.margin('0'),
    color: HBC_COLORS.gray500,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    maxWidth: '480px',
  },
});

export const OnboardingPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="Onboarding" />
      <div className={styles.container}>
        <h3 className={styles.heading}>Coming Soon</h3>
        <p className={styles.description}>
          Employee onboarding tracking with checklist management, orientation scheduling, and completion monitoring.
        </p>
      </div>
    </div>
  );
};
