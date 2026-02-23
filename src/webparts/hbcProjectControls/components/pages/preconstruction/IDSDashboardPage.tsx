import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';

const useStyles = makeStyles({
  content: {
    ...shorthands.padding('16px', '0'),
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

export const IDSDashboardPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="Innovation & Digital Services" />
      <div className={styles.content}>
        <p className={styles.description}>
          IDS department dashboard. Digital transformation initiative tracking and project oversight
          modules will be expanded in a future phase.
        </p>
      </div>
    </div>
  );
};
