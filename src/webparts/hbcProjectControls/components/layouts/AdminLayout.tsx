import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
import { WorkspaceLayout } from './WorkspaceLayout';

/**
 * Admin workspace layout.
 * Wraps all admin routes in the generic WorkspaceLayout.
 */
export const AdminLayout: React.FC = () => (
  <WorkspaceLayout workspaceId="admin">
    <Outlet />
  </WorkspaceLayout>
);
