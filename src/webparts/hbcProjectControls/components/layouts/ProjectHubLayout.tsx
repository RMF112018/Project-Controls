import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
import { makeStyles, shorthands, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';
import { WorkspaceLayout } from './WorkspaceLayout';
import { ProjectHubProvider } from '../project-hub/ProjectHubProvider';
import { useProjectParams } from '../common/useProjectParams';

const useStyles = makeStyles({
  bannerContent: {
    ...shorthands.padding('48px'),
    textAlign: 'center' as const,
  },
  banner: {
    ...shorthands.margin('24px', 'auto'),
    maxWidth: '600px',
  },
});

export const ProjectHubLayout: React.FC = () => {
  const styles = useStyles();

  // Unified project detection: merges AppContext.selectedProject and URL ?projectCode.
  // Stage 19 cross-workspace navigation (Preconstruction → Project Hub) passes
  // ?projectCode=XXX without setting context — useProjectParams handles both sources.
  const { hasProject } = useProjectParams();

  if (!hasProject) {
    return (
      <WorkspaceLayout workspaceId="project-hub">
        <div className={styles.bannerContent}>
          <MessageBar intent="warning" className={styles.banner}>
            <MessageBarBody>
              <MessageBarTitle>No Project Selected</MessageBarTitle>
              Please select a project from the picker to access the Project Hub.
            </MessageBarBody>
          </MessageBar>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout workspaceId="project-hub">
      <ProjectHubProvider>
        <Outlet />
      </ProjectHubProvider>
    </WorkspaceLayout>
  );
};
