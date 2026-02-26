import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
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
export const WorkspaceLayout: React.FC<IWorkspaceLayoutProps> = ({ workspaceId, children }) => {
  const { telemetryService } = useAppContext();

  return (
    <div data-workspace={workspaceId}>
      <ErrorBoundary
        boundaryName="WorkspaceLayout"
        telemetryService={telemetryService}
        telemetryProperties={{ workspaceId }}
      >
        <React.Suspense fallback={<RouteSuspenseFallback />}>
          {children}
        </React.Suspense>
      </ErrorBoundary>
    </div>
  );
};
