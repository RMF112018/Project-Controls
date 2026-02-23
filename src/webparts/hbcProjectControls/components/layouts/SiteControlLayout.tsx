import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
import { WorkspaceLayout } from './WorkspaceLayout';

/**
 * HB Site Control workspace layout.
 * Wraps all site control routes in the generic WorkspaceLayout.
 */
export const SiteControlLayout: React.FC = () => (
  <WorkspaceLayout workspaceId="site-control">
    <Outlet />
  </WorkspaceLayout>
);
