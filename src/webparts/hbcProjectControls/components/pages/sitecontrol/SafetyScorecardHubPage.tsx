import * as React from 'react';
import { makeStyles, shorthands, tokens, Text } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('24px', '0'),
  },
  placeholder: {
    ...shorthands.padding('48px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
  },
});

export const SafetyScorecardHubPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="Safety Scorecard" subtitle="Aggregated safety performance metrics and trend analysis." />
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <Text size={400} weight="semibold">Safety Scorecard</Text>
          <br />
          <Text size={300}>Safety KPIs, incident rates, inspection pass rates, and trend charts will appear here.</Text>
        </div>
      </div>
    </div>
  );
};
