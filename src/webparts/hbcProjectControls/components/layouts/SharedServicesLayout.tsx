import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
import { WorkspaceLayout } from './WorkspaceLayout';

/**
 * Shared Services workspace layout.
 * Wraps all shared services routes in the generic WorkspaceLayout.
 */
export const SharedServicesLayout: React.FC = () => (
  <WorkspaceLayout workspaceId="shared-services">
    <Outlet />
  </WorkspaceLayout>
);
