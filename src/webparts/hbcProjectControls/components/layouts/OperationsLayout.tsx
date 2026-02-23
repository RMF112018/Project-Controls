import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
import { WorkspaceLayout } from './WorkspaceLayout';

/**
 * Operations workspace layout.
 * Wraps all operations routes in the generic WorkspaceLayout.
 */
export const OperationsLayout: React.FC = () => (
  <WorkspaceLayout workspaceId="operations">
    <Outlet />
  </WorkspaceLayout>
);
