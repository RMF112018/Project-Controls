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

export const PersonnelLogPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="Personnel Log" subtitle="Daily sign-in/out records for all jobsite personnel." />
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <Text size={400} weight="semibold">Personnel Log</Text>
          <br />
          <Text size={300}>Sign-in/out records, time tracking, and personnel activity will appear here.</Text>
        </div>
      </div>
    </div>
  );
};
