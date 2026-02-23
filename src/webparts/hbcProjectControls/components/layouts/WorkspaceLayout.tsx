import * as React from 'react';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { RouteSuspenseFallback } from '../boundaries/RouteSuspenseFallback';

interface IWorkspaceLayoutProps {
  workspaceId: string;
  children: React.ReactNode;
}

/**
 * Generic workspace layout wrapper.
 * Provides workspace identification, error boundary, and suspense fallback.
 */
export const WorkspaceLayout: React.FC<IWorkspaceLayoutProps> = ({ workspaceId, children }) => (
  <div data-workspace={workspaceId}>
    <ErrorBoundary>
      <React.Suspense fallback={<RouteSuspenseFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  </div>
);
