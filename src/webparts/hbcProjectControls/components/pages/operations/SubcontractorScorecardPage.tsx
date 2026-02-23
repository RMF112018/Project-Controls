import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { ComingSoonPage } from '../../shared/ComingSoonPage';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
});

export const SubcontractorScorecardPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <PageHeader
        title="Subcontractor Scorecard"
        subtitle="Subcontractor performance scoring and tracking"
      />
      <ComingSoonPage title="Subcontractor Scorecard" />
    </div>
  );
};
