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

export const ToolBoxTalksPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="Tool-Box Talks" subtitle="Daily safety briefing topics, attendance, and recommendations." />
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <Text size={400} weight="semibold">Tool-Box Talks</Text>
          <br />
          <Text size={300}>Topic library, attendance tracking, and weather-based recommendations will appear here.</Text>
        </div>
      </div>
    </div>
  );
};
