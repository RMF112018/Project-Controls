import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { useAppContext } from '../../contexts/AppContext';
import { ProjectRequiredGuard } from '../../common/ProjectRequiredGuard';

const useStyles = makeStyles({
  content: {
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
  description: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
});

const EstimatingProjectHubContent: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  // Guard guarantees selectedProject is non-null
  const projectName = selectedProject?.projectName ?? '';
  const projectCode = selectedProject?.projectCode ?? '';

  return (
    <div>
      <PageHeader title={`Estimating Project Hub \u2014 ${projectName}`} />
      <div className={styles.content}>
        <p className={styles.description}>
          Project-scoped estimating workspace for <strong>{projectCode}</strong>.
          Detailed estimating modules will be built in a future phase.
        </p>
      </div>
    </div>
  );
};

export const EstimatingProjectHubPage = React.memo(() => (
  <ProjectRequiredGuard
    pageTitle="Estimating Project Hub"
    description="Select a project from the picker to view Estimating details."
  >
    <EstimatingProjectHubContent />
  </ProjectRequiredGuard>
));

EstimatingProjectHubPage.displayName = 'EstimatingProjectHubPage';
