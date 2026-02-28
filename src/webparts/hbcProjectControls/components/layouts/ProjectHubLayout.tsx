import * as React from 'react';
import { Outlet, useSearch } from '@tanstack/react-router';
import { makeStyles, shorthands, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useAppContext } from '../contexts/AppContext';

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
  const { selectedProject } = useAppContext();
  const styles = useStyles();

  // Stage 19 routing fix: Check URL search params for projectCode as fallback.
  // DepartmentTrackingPage navigates here with ?projectCode=XXX for cross-workspace
  // navigation (Preconstruction → Project Hub) without setting selectedProject in context.
  // Child routes (PHProjectTurnoverPage, ProjectHubDashboardPage) read projectCode from
  // search params independently — the layout just needs to allow <Outlet /> to render.
  const searchParams = useSearch({ strict: false }) as { projectCode?: string };
  const hasProject = !!selectedProject || !!searchParams.projectCode;

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
      <Outlet />
    </WorkspaceLayout>
  );
};
