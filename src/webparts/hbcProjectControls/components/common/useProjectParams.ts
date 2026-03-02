import * as React from 'react';
import { useSearch } from '@tanstack/react-router';
import { z } from 'zod';
import { useAppContext } from '../contexts/AppContext';
import { useAppParams } from '../hooks/router/useAppParams';
import { normalizeToPid } from '../utils/projectPid';
import type { ISelectedProject } from '@hbc/sp-services';

// ── Zod schema for URL search params ────────────────────────────────────
const searchParamsSchema = z.object({
  projectCode: z.string().optional(),
  // HBC-PC-PID-001: Short project identifier (exactly 7-char hex prefix) — canonical
  pid: z.string().regex(/^[0-9a-f]{7}$/i).optional().catch(undefined),
  // HBC-PC-UUID-001: Backward compat — old ?projectUuid= URLs still accepted
  projectUuid: z.string().uuid().optional().catch(undefined),
  leadId: z.coerce.number().optional().catch(undefined),
  handoffFrom: z.string().optional(),
});

/**
 * Resolved project parameters from URL + context.
 * Priority order:
 *   1. URL search params (?pid, ?projectCode, ?leadId, ?handoffFrom)
 *   2. Route dynamic params ($leadId)
 *   3. AppContext.selectedProject
 */
export interface IProjectParams {
  /** Resolved project code (search param > context). Empty string if none. */
  projectCode: string;
  /** HBC-PC-PID-001: Short pid from URL (7-char prefix). Undefined if none. */
  pid: string | undefined;
  /** HBC-PC-UUID-001: Resolved full projectUuid (context). Undefined if none. */
  projectUuid: string | undefined;
  /** Resolved lead ID (search param > route param > context). Undefined if none. */
  leadId: number | undefined;
  /** Whether a valid projectCode, pid, or projectUuid was resolved from any source. */
  hasProject: boolean;
  /** The full ISelectedProject from context, or null. */
  selectedProject: ISelectedProject | null;
  /** The handoffFrom search param, if present (for turnover flow). */
  handoffFrom: string | undefined;
}

/**
 * Unified hook that merges URL search params, route dynamic params, and
 * AppContext.selectedProject into a single validated IProjectParams object.
 *
 * Uses Zod v4 safeParse for runtime validation of search params. Invalid
 * values (e.g. non-numeric leadId) are silently dropped to undefined.
 */
export function useProjectParams(): IProjectParams {
  const { selectedProject } = useAppContext();

  // Search params: ?pid, ?projectCode, ?leadId, ?handoffFrom
  const rawSearch = useSearch({ strict: false });

  // Route params: $leadId (from routes like /preconstruction/bd/go-no-go/$leadId)
  const routeParams = useAppParams<{ leadId?: string }>();

  return React.useMemo((): IProjectParams => {
    // Validate search params through Zod schema
    const parsed = searchParamsSchema.safeParse(rawSearch);
    const search = parsed.success ? parsed.data : {};

    // Priority: search param > context
    const projectCode =
      search.projectCode ??
      selectedProject?.projectCode ??
      '';

    // HBC-PC-PID-001: pid takes precedence over legacy projectUuid
    const rawPidOrUuid = search.pid ?? search.projectUuid;
    const pid = rawPidOrUuid ? normalizeToPid(rawPidOrUuid) : undefined;

    // Full projectUuid from context (internal use)
    const projectUuid = selectedProject?.projectUuid;

    // Priority: search param > route param > context
    const routeLeadId = routeParams.leadId ? Number(routeParams.leadId) : undefined;
    const leadId =
      search.leadId ??
      (Number.isFinite(routeLeadId) ? routeLeadId : undefined) ??
      selectedProject?.leadId;

    const handoffFrom = search.handoffFrom;

    return {
      projectCode,
      pid,
      projectUuid,
      leadId,
      hasProject: projectCode.length > 0 || !!pid || !!projectUuid,
      selectedProject,
      handoffFrom,
    };
  }, [rawSearch, routeParams, selectedProject]);
}
