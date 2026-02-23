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

export const QCHubDocumentsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <PageHeader title="QC Documents" subtitle="Quality control standards, reference materials, and templates." />
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <Text size={400} weight="semibold">QC Documents</Text>
          <br />
          <Text size={300}>Quality standards, inspection templates, best practices, and regulatory documents will appear here.</Text>
        </div>
      </div>
    </div>
  );
};
