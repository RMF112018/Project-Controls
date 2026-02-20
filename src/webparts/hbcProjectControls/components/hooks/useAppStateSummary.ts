import { useCallback } from 'react';
import { useLocation } from '@router';
import { useAppContext } from '../contexts/AppContext';
import { useProjectSelection } from './useProjectSelection';
import { useCurrentModule } from './useCurrentModule';
import { APP_VERSION } from '@hbc/sp-services';

export interface IAppStateSummary {
  user: { displayName: string; email: string; roles: string[] };
  currentModule: string | null;
  currentUrl: string;
  activeProject: { projectCode: string; projectName: string } | null;
  enabledFlagCount: number;
  totalFlagCount: number;
  browserInfo: { userAgent: string; screenSize: string; timestamp: string };
  appVersion: string;
}

export function useAppStateSummary() {
  const { currentUser, featureFlags } = useAppContext();
  const { projectCode, projectMeta } = useProjectSelection();
  const currentModule = useCurrentModule();
  const { pathname } = useLocation();

  const getStateSummary = useCallback((): IAppStateSummary => {
    const enabledCount = featureFlags.filter(f => f.Enabled).length;

    return {
      user: {
        displayName: currentUser?.displayName ?? 'Unknown',
        email: currentUser?.email ?? 'unknown',
        roles: currentUser?.roles ?? [],
      },
      currentModule,
      currentUrl: window.location.href,
      activeProject: projectCode
        ? { projectCode, projectName: projectMeta?.projectName ?? projectCode }
        : null,
      enabledFlagCount: enabledCount,
      totalFlagCount: featureFlags.length,
      browserInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      },
      appVersion: APP_VERSION,
    };
  }, [currentUser, projectCode, projectMeta?.projectName, featureFlags, currentModule, pathname]);

  return { getStateSummary };
}
