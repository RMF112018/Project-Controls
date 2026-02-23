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

export const IssueResolutionPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="Issue Resolution" subtitle="Five-bucket workflow for tracking and resolving quality issues." />
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <Text size={400} weight="semibold">Issue Resolution Board</Text>
          <br />
          <Text size={300}>Kanban-style issue tracking across Open, In Progress, Pending Review, Resolved, and Closed buckets will appear here.</Text>
        </div>
      </div>
    </div>
  );
};
