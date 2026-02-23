import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcButton } from '../../shared/HbcButton';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  content: {
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
    fontWeight: tokens.fontWeightSemibold,
  },
  description: {
    ...shorthands.margin('0', '0', '24px', '0'),
    color: HBC_COLORS.gray500,
    fontSize: '14px',
    maxWidth: '400px',
  },
});

export const SafetyPlanPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();

  return (
    <div className={styles.container}>
      <PageHeader title="Safety Plan" />
      <div className={styles.content}>
        <h3 className={styles.heading}>Coming Soon</h3>
        <p className={styles.description}>
          Project-specific safety plan documentation is being developed. Visit the Safety
          Dashboard for current safety resources.
        </p>
        <HbcButton emphasis="strong" onClick={() => navigate('/operations/safety')}>
          Go to Safety Dashboard
        </HbcButton>
      </div>
    </div>
  );
};
