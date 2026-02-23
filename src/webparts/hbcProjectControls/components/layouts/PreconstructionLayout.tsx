import * as React from 'react';
import { Outlet } from '@tanstack/react-router';
import { WorkspaceLayout } from './WorkspaceLayout';

/**
 * Preconstruction workspace layout.
 * Wraps all preconstruction routes in the generic WorkspaceLayout.
 */
export const PreconstructionLayout: React.FC = () => (
  <WorkspaceLayout workspaceId="preconstruction">
    <Outlet />
  </WorkspaceLayout>
);
