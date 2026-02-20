import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useProjectPersistence } from './useProjectPersistence';
import { useAppLocation } from './router/useAppLocation';
import { useAppNavigate } from './router/useAppNavigate';
import { useProjectRouteId } from './useProjectRouteId';

export function useProjectSelectionBootstrap(): void {
  const { currentUser } = useAppContext();
  const persistence = useProjectPersistence(currentUser?.email ?? 'anonymous');
  const location = useAppLocation();
  const navigate = useAppNavigate();
  const projectId = useProjectRouteId();
  const hasSeededRef = React.useRef(false);

  React.useEffect(() => {
    if (hasSeededRef.current) {
      return;
    }
    if (projectId || location.pathname !== '/operations') {
      return;
    }

    const persistedProjectId = persistence.loadPersistedProjectId();
    if (!persistedProjectId) {
      hasSeededRef.current = true;
      return;
    }

    hasSeededRef.current = true;
    React.startTransition(() => {
      navigate(`/operations/${encodeURIComponent(persistedProjectId)}/project`, { replace: true });
    });
  }, [location.pathname, navigate, persistence, projectId]);
}
