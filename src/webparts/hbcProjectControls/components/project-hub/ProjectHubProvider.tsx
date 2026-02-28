/**
 * Stage 20 — ProjectHubProvider
 *
 * Wraps the Project Hub layout outlet. On mount, reads search params
 * (projectCode, leadId) and syncs them to AppContext.selectedProject.
 * This ensures that sidebar navigation (static paths) works after
 * initial deep-link entry because selectedProject is populated.
 *
 * Resolution strategy:
 * 1. If leadId is provided → getLeadById(leadId) for O(1) lookup
 * 2. If only projectCode → searchLeads(projectCode) and match exact code
 * 3. If neither → no-op (normal ProjectPicker flow)
 */
import * as React from 'react';
import { useSearch } from '@tanstack/react-router';
import type { ISelectedProject } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';

// ── Context ─────────────────────────────────────────────────────────────

interface IProjectHubContextValue {
  /** Effective projectCode (search params → context fallback) */
  projectCode: string;
  /** LeadID from search params or context */
  leadId: number | undefined;
  /** Project name (populated after async resolution) */
  projectName: string;
  /** True while resolving full project data from dataService */
  isResolving: boolean;
}

const ProjectHubContext = React.createContext<IProjectHubContextValue | undefined>(undefined);

/**
 * Read the current Project Hub context. Must be used within ProjectHubProvider.
 */
export function useProjectHub(): IProjectHubContextValue {
  const ctx = React.useContext(ProjectHubContext);
  if (!ctx) {
    throw new Error('useProjectHub must be used within ProjectHubProvider');
  }
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────

interface IProjectHubProviderProps {
  children: React.ReactNode;
}

export const ProjectHubProvider: React.FC<IProjectHubProviderProps> = ({ children }) => {
  const { dataService, selectedProject, setSelectedProject } = useAppContext();
  const searchParams = useSearch({ strict: false }) as {
    projectCode?: string;
    leadId?: number;
  };

  const [isResolving, setIsResolving] = React.useState(false);

  // Effective values: search params take precedence, then context
  const effectiveProjectCode = searchParams.projectCode || selectedProject?.projectCode || '';
  const effectiveLeadId = searchParams.leadId ?? selectedProject?.leadId;

  // Track resolved code to avoid duplicate resolution on re-renders
  const resolvedCodeRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const searchCode = searchParams.projectCode;

    // Skip if: no search-param projectCode
    if (!searchCode) return;

    // Skip if: AppContext already has the correct project
    if (selectedProject?.projectCode === searchCode) {
      resolvedCodeRef.current = searchCode;
      return;
    }

    // Skip if: already resolved this code (prevents re-resolution on context changes)
    if (resolvedCodeRef.current === searchCode) return;

    let cancelled = false;
    setIsResolving(true);

    const resolve = async (): Promise<void> => {
      try {
        let resolved: ISelectedProject | null = null;

        // Strategy 1: getLeadById (O(1)) when leadId is available
        if (searchParams.leadId) {
          const lead = await dataService.getLeadById(searchParams.leadId);
          if (lead && lead.ProjectCode === searchCode) {
            resolved = {
              projectCode: lead.ProjectCode!,
              projectName: lead.Title,
              stage: lead.Stage,
              region: lead.Region,
              division: lead.Division,
              leadId: lead.id,
              siteUrl: lead.ProjectSiteURL,
              clientName: lead.ClientName,
              projectValue: lead.ProjectValue,
            };
          }
        }

        // Strategy 2: searchLeads fallback when leadId absent or mismatched
        if (!resolved) {
          const results = await dataService.searchLeads(searchCode);
          const match = results.find(l => l.ProjectCode === searchCode);
          if (match) {
            resolved = {
              projectCode: match.ProjectCode!,
              projectName: match.Title,
              stage: match.Stage,
              region: match.Region,
              division: match.Division,
              leadId: match.id,
              siteUrl: match.ProjectSiteURL,
              clientName: match.ClientName,
              projectValue: match.ProjectValue,
            };
          }
        }

        if (!cancelled && resolved) {
          resolvedCodeRef.current = searchCode;
          setSelectedProject(resolved);
        }
      } catch (err) {
        // On failure, mark as resolved to prevent retry loop.
        // The minimal ISelectedProject from layout beforeLoad is still
        // in route context, so child routes won't redirect.
        console.warn('ProjectHubProvider: failed to resolve project', searchCode, err);
        if (!cancelled) {
          resolvedCodeRef.current = searchCode;
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    };

    void resolve();
    return () => { cancelled = true; };
  }, [searchParams.projectCode, searchParams.leadId, selectedProject?.projectCode, dataService, setSelectedProject]);

  const value = React.useMemo<IProjectHubContextValue>(() => ({
    projectCode: effectiveProjectCode,
    leadId: effectiveLeadId,
    projectName: selectedProject?.projectName || '',
    isResolving,
  }), [effectiveProjectCode, effectiveLeadId, selectedProject?.projectName, isResolving]);

  return (
    <ProjectHubContext.Provider value={value}>
      {children}
    </ProjectHubContext.Provider>
  );
};
