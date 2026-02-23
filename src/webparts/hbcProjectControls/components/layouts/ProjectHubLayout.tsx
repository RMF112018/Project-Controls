import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
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

  if (!selectedProject) {
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
