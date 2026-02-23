import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { useAppContext } from '../../contexts/AppContext';
import { HbcEmptyState } from '../../shared/HbcEmptyState';

const useStyles = makeStyles({
  content: {
    ...shorthands.padding('16px', '0'),
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

export const EstimatingProjectHubPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  if (!selectedProject) {
    return (
      <div>
        <PageHeader title="Estimating Project Hub" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view Estimating details."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Estimating Project Hub — ${selectedProject.projectName}`} />
      <div className={styles.content}>
        <p className={styles.description}>
          Project-scoped estimating workspace for <strong>{selectedProject.projectCode}</strong>.
          Detailed estimating modules will be built in a future phase.
        </p>
      </div>
    </div>
  );
};
