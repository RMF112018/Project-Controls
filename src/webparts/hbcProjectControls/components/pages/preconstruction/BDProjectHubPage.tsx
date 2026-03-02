import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { useAppContext } from '../../contexts/AppContext';
import { ProjectRequiredGuard } from '../../common/ProjectRequiredGuard';

const useStyles = makeStyles({
  content: {
    ...shorthands.padding('16px', '0'),
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
  },
});

const BDProjectHubContent: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  // Guard guarantees selectedProject is non-null
  const projectName = selectedProject?.projectName ?? '';
  const projectCode = selectedProject?.projectCode ?? '';

  return (
    <div>
      <PageHeader title={`BD Project Hub \u2014 ${projectName}`} />
      <div className={styles.content}>
        <p className={styles.description}>
          Project-scoped BD workspace for <strong>{projectCode}</strong>.
          Detailed project BD tracking modules will be built in a future phase.
        </p>
      </div>
    </div>
  );
};

export const BDProjectHubPage: React.FC = () => (
  <ProjectRequiredGuard
    pageTitle="BD Project Hub"
    description="Select a project from the picker to view Business Development details."
  >
    <BDProjectHubContent />
  </ProjectRequiredGuard>
);
