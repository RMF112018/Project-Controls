import * as React from 'react';
import { useRouterAdapter } from '../contexts/RouterAdapterContext';

const LEGACY_OPERATIONS_SEGMENTS = new Set<string>([
  'project',
  'compliance-log',
  'project-settings',
  'startup-checklist',
  'management-plan',
  'superintendent-plan',
  'closeout-checklist',
  'buyout-log',
  'contract-tracking',
  'risk-cost',
  'schedule',
  'quality-concerns',
  'safety-concerns',
  'monthly-review',
  'constraints-log',
  'permits-log',
  'responsibility',
  'project-record',
  'lessons-learned',
  'readicheck',
  'best-practices',
  'sub-scorecard',
  'gonogo',
]);

export function extractProjectIdFromPathname(pathname: string): string | null {
  if (!pathname.startsWith('/operations/')) {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  // Expected paramized shape: /operations/$projectId/{tool}
  if (segments.length < 3) {
    return null;
  }

  const candidate = segments[1];
  if (!candidate || LEGACY_OPERATIONS_SEGMENTS.has(candidate)) {
    return null;
  }

  return decodeURIComponent(candidate);
}

function extractProjectIdFromHash(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.replace(/^#/, '');
  const pathname = hash.startsWith('/') ? hash : `/${hash}`;
  return extractProjectIdFromPathname(pathname);
}

export function useProjectRouteId(): string | null {
  const { params, pathname } = useRouterAdapter();

  return React.useMemo(() => {
    if (params.projectId) {
      return params.projectId;
    }

    const parsedFromPath = extractProjectIdFromPathname(pathname);
    if (parsedFromPath) {
      return parsedFromPath;
    }

    return extractProjectIdFromHash();
  }, [params.projectId, pathname]);
}

