import * as React from 'react';
import { ProjectRequiredGuard } from '../common/ProjectRequiredGuard';

interface IProjectRequiredRouteProps {
  children: React.ReactNode;
}

export const ProjectRequiredRoute: React.FC<IProjectRequiredRouteProps> = ({ children }) => (
  <ProjectRequiredGuard description="Select a project from the picker to view this tool.">
    {children}
  </ProjectRequiredGuard>
);
