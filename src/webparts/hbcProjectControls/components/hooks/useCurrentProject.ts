/**
 * HBC-PC-NAV-001 / HBC-PC-UUID-001 / HBC-PC-PID-001 — useCurrentProject
 *
 * Bidirectional sync between URL `?pid` search parameter and
 * AppContext.selectedProject. The `pid` is a 7-char hex prefix of the full
 * projectUuid. Gated on the `ProjectUuidNavigation` feature flag;
 * when disabled, returns passthrough values with no URL sync behavior.
 *
 * Backward compat: old `?projectUuid=xxx` URLs are accepted and normalized
 * to `?pid=xxx` on next write.
 *
 * CRITICAL: All URL/context mutations use `useEffect` (never render-phase)
 * to avoid the RouterProvider infinite re-render bug. See CLAUDE.md and
 * commit docs for RouterProvider context prop bug (Feb 2026).
 */
import * as React from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { Stage } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { toShortPid } from '../utils/projectPid';

export interface IUseCurrentProjectResult {
  /** The currently resolved projectUuid (from URL or context), or null. */
  projectUuid: string | null;
  /** The full selected project from context. */
  selectedProject: ReturnType<typeof useAppContext>['selectedProject'];
  /** Set the current project by UUID — updates both URL and context. */
  setCurrentProject: (uuid: string | null) => void;
  /** True while resolving a UUID from the data service. */
  isResolving: boolean;
}

export function useCurrentProject(): IUseCurrentProjectResult {
  const {
    selectedProject,
    setSelectedProject,
    isFeatureEnabled,
    dataService,
    telemetryService,
  } = useAppContext();

  const tanStackNavigate = useNavigate();
  const navRef = React.useRef(tanStackNavigate);
  navRef.current = tanStackNavigate;

  const flagEnabled = isFeatureEnabled('ProjectUuidNavigation');

  // HBC-PC-PID-001: Read pid (canonical) or projectUuid (backward compat) from URL
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const urlPidOrUuid = (() => {
    if (!flagEnabled) return null;
    if (typeof rawSearch.pid === 'string') return rawSearch.pid;
    if (typeof rawSearch.projectUuid === 'string') return rawSearch.projectUuid;
    return null;
  })();
  const urlPidOrUuidRef = React.useRef(urlPidOrUuid);
  urlPidOrUuidRef.current = urlPidOrUuid;

  const [isResolving, setIsResolving] = React.useState(false);

  // ── URL → Context sync (deferred via useEffect) ────────────────────────
  // When the URL has a pid/projectUuid that differs from context, resolve and set.
  React.useEffect(() => {
    if (!flagEnabled) return;
    if (!urlPidOrUuid) return;
    // Compare short pid of context UUID against URL value
    const contextPid = selectedProject?.projectUuid ? toShortPid(selectedProject.projectUuid) : null;
    const urlPid = toShortPid(urlPidOrUuid.replace(/-/g, ''));

    // If pids match, clean up any legacy params (projectUuid, projectCode, leadId) and return
    if (contextPid === urlPid) {
      const rs = rawSearch as Record<string, unknown>;
      const hasLegacy = typeof rs.projectUuid === 'string'
        || typeof rs.projectCode === 'string'
        || rs.leadId !== undefined;
      if (hasLegacy) {
        const { projectUuid: _u, projectCode: _c, leadId: _l, ...clean } =
          rs as Record<string, unknown> & { projectUuid?: string; projectCode?: string; leadId?: unknown };
        void navRef.current({
          to: '.',
          search: { ...clean, pid: urlPid },
          replace: true,
        } as unknown as Parameters<typeof navRef.current>[0]);
      }
      return;
    }

    let cancelled = false;
    setIsResolving(true);

    (async () => {
      try {
        // Try lead first (covers BD pipeline projects), then active project
        const lead = await dataService.getLeadByPidOrUuid(urlPidOrUuid);
        if (cancelled) return;

        if (lead) {
          setSelectedProject({
            projectCode: lead.ProjectCode ?? '',
            projectUuid: lead.projectUuid,
            projectName: lead.Title,
            stage: lead.Stage,
            leadId: lead.id,
          });
          telemetryService.trackEvent({ name: 'navigation-with-uuid', properties: { source: 'url', resolvedVia: 'lead' } });
        } else {
          const project = await dataService.getActiveProjectByPidOrUuid(urlPidOrUuid);
          if (cancelled) return;

          if (project) {
            setSelectedProject({
              projectCode: project.projectCode,
              projectUuid: project.projectUuid,
              projectName: project.projectName,
              stage: Stage.ActiveConstruction,
            });
            telemetryService.trackEvent({ name: 'navigation-with-uuid', properties: { source: 'url', resolvedVia: 'activeProject' } });
          } else {
            telemetryService.trackEvent({ name: 'uuid-resolution-fallback', properties: { pid: urlPidOrUuid } });
          }
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flagEnabled, urlPidOrUuid, selectedProject?.projectUuid, dataService, setSelectedProject]);

  // ── Context → URL sync (deferred via useEffect) ────────────────────────
  // When context has a projectUuid that differs from URL, update the URL with short pid.
  React.useEffect(() => {
    if (!flagEnabled) return;
    const contextUuid = selectedProject?.projectUuid;
    if (!contextUuid) return;
    const contextPid = toShortPid(contextUuid);
    const currentUrlPid = urlPidOrUuidRef.current ? toShortPid(urlPidOrUuidRef.current.replace(/-/g, '')) : null;
    if (contextPid === currentUrlPid) return;

    // HBC-PC-PID-001: Write short pid to URL, strip legacy projectUuid/projectCode/leadId
    const { projectUuid: _u, projectCode: _c, leadId: _l, ...cleanSearch } =
      rawSearch as Record<string, unknown> & { projectUuid?: string; projectCode?: string; leadId?: unknown };
    void navRef.current({
      to: '.',
      search: {
        ...cleanSearch,
        pid: contextPid,
      },
      replace: true,
    } as unknown as Parameters<typeof navRef.current>[0]);
  }, [flagEnabled, selectedProject?.projectUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── setCurrentProject: imperative API ──────────────────────────────────
  const setCurrentProject = React.useCallback(
    (uuid: string | null) => {
      if (!flagEnabled) return;

      if (uuid === null) {
        // Clear project context and remove all project-related params from URL
        setSelectedProject(null);
        const { pid: _removedPid, projectUuid: _removedUuid, projectCode: _removedCode, leadId: _removedLead, ...rest } =
          rawSearch as Record<string, unknown> & { pid?: string; projectUuid?: string; projectCode?: string; leadId?: unknown };
        void navRef.current({
          to: '.',
          search: rest,
          replace: true,
        } as unknown as Parameters<typeof navRef.current>[0]);
        return;
      }

      // Resolve UUID and set both context and URL
      const shortPid = toShortPid(uuid);
      telemetryService.trackEvent({ name: 'project-context-switch', properties: { pid: shortPid, source: 'header-selector' } });
      setIsResolving(true);

      (async () => {
        try {
          const lead = await dataService.getLeadByPidOrUuid(uuid);
          if (lead) {
            setSelectedProject({
              projectCode: lead.ProjectCode ?? '',
              projectUuid: lead.projectUuid,
              projectName: lead.Title,
              stage: lead.Stage,
              leadId: lead.id,
            });
          } else {
            const project = await dataService.getActiveProjectByPidOrUuid(uuid);
            if (project) {
              setSelectedProject({
                projectCode: project.projectCode,
                projectUuid: project.projectUuid,
                projectName: project.projectName,
                stage: Stage.ActiveConstruction,
              });
            }
          }
        } finally {
          setIsResolving(false);
        }

        // HBC-PC-PID-001: Update URL with short pid, strip legacy projectUuid/projectCode/leadId
        const { projectUuid: _u, projectCode: _c, leadId: _l, ...cleanSearch } =
          rawSearch as Record<string, unknown> & { projectUuid?: string; projectCode?: string; leadId?: unknown };
        void navRef.current({
          to: '.',
          search: {
            ...cleanSearch,
            pid: shortPid,
          },
          replace: true,
        } as unknown as Parameters<typeof navRef.current>[0]);
      })();
    },
    [flagEnabled, dataService, setSelectedProject, rawSearch, telemetryService],
  );

  return React.useMemo<IUseCurrentProjectResult>(
    () => ({
      projectUuid: flagEnabled
        ? (selectedProject?.projectUuid ?? (urlPidOrUuid ? urlPidOrUuid : null))
        : (selectedProject?.projectUuid ?? null),
      selectedProject,
      setCurrentProject,
      isResolving,
    }),
    [flagEnabled, selectedProject, urlPidOrUuid, setCurrentProject, isResolving],
  );
}
