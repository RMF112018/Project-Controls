import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IProjectManagementPlan, IDivisionApprover, IPMPBoilerplateSection, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useHbcOptimisticMutation } from '../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../tanstack/query/mutations/optimisticMutationFlags';
import { mergePmpOptimistic } from '../../tanstack/query/mutations/optimisticPatchers';

interface IUseProjectManagementPlanResult {
  pmp: IProjectManagementPlan | null;
  boilerplate: IPMPBoilerplateSection[];
  divisionApprovers: IDivisionApprover[];
  isLoading: boolean;
  error: string | null;
  fetchPlan: (projectCode: string) => Promise<void>;
  updatePlan: (projectCode: string, data: Partial<IProjectManagementPlan>) => Promise<void>;
  submitForApproval: (projectCode: string, submittedBy: string) => Promise<void>;
  respondToApproval: (projectCode: string, stepId: number, approved: boolean, comment: string) => Promise<void>;
  signPlan: (projectCode: string, signatureId: number, comment: string) => Promise<void>;
  canSubmit: boolean;
}

export function useProjectManagementPlan(): IUseProjectManagementPlanResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const [pmp, setPmp] = React.useState<IProjectManagementPlan | null>(null);
  const [boilerplate, setBoilerplate] = React.useState<IPMPBoilerplateSection[]>([]);
  const [divisionApprovers, setDivisionApprovers] = React.useState<IDivisionApprover[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);
  const pmpCacheKey = React.useMemo(() => ['local', 'pmp'] as const, []);

  const fetchPlan = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const [planResult, boilerplateResult, approversResult] = await Promise.all([
        dataService.getProjectManagementPlan(projectCode),
        dataService.getPMPBoilerplate(),
        dataService.getDivisionApprovers(),
      ]);
      setPmp(planResult);
      queryClient.setQueryData<IProjectManagementPlan | null>(pmpCacheKey, planResult);
      setBoilerplate(boilerplateResult);
      setDivisionApprovers(approversResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PMP');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, pmpCacheKey, queryClient]);

  // SignalR: refresh on PMP entity changes from other users
  useSignalR({
    entityType: EntityType.PMP,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchPlan(lastProjectCodeRef.current);
      }
    }, [fetchPlan]),
  });

  // Helper to broadcast PMP changes
  const broadcastPMPChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.PMP,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updatePlanMutation = useHbcOptimisticMutation<IProjectManagementPlan, { projectCode: string; data: Partial<IProjectManagementPlan> }, IProjectManagementPlan | null>({
    method: 'updateProjectManagementPlan',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.pmp,
    mutationFn: async ({ projectCode, data }) => dataService.updateProjectManagementPlan(projectCode, data),
    getStateKey: () => pmpCacheKey,
    applyOptimistic: (previous, vars) => mergePmpOptimistic(previous ?? null, vars.data),
    onOptimisticStateChange: (state) => setPmp(state ?? null),
    onSuccessEffects: async (updated, vars) => {
      setPmp(updated);
      broadcastPMPChange(vars.projectCode, 'updated', 'PMP updated');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: pmpCacheKey });
    },
  });

  const submitForApprovalMutation = useHbcOptimisticMutation<IProjectManagementPlan, { projectCode: string; submittedBy: string }, IProjectManagementPlan | null>({
    method: 'submitPMPForApproval',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.pmp,
    mutationFn: async ({ projectCode, submittedBy }) => dataService.submitPMPForApproval(projectCode, submittedBy),
    getStateKey: () => pmpCacheKey,
    applyOptimistic: (previous) => previous ?? null,
    onSuccessEffects: async (updated, vars) => {
      setPmp(updated);
      broadcastPMPChange(vars.projectCode, 'updated', 'PMP submitted for approval');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: pmpCacheKey });
    },
  });

  const respondToApprovalMutation = useHbcOptimisticMutation<IProjectManagementPlan, { projectCode: string; stepId: number; approved: boolean; comment: string }, IProjectManagementPlan | null>({
    method: 'respondToPMPApproval',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.pmp,
    mutationFn: async ({ projectCode, stepId, approved, comment }) => dataService.respondToPMPApproval(projectCode, stepId, approved, comment),
    getStateKey: () => pmpCacheKey,
    applyOptimistic: (previous) => previous ?? null,
    onSuccessEffects: async (updated, vars) => {
      setPmp(updated);
      broadcastPMPChange(vars.projectCode, 'updated', `PMP approval ${vars.approved ? 'approved' : 'rejected'}`);
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: pmpCacheKey });
    },
  });

  const signPlanMutation = useHbcOptimisticMutation<IProjectManagementPlan, { projectCode: string; signatureId: number; comment: string }, IProjectManagementPlan | null>({
    method: 'signPMP',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.pmp,
    mutationFn: async ({ projectCode, signatureId, comment }) => dataService.signPMP(projectCode, signatureId, comment),
    getStateKey: () => pmpCacheKey,
    applyOptimistic: (previous) => previous ?? null,
    onSuccessEffects: async (updated, vars) => {
      setPmp(updated);
      broadcastPMPChange(vars.projectCode, 'updated', 'PMP signed');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: pmpCacheKey });
    },
  });

  const updatePlan = React.useCallback(async (projectCode: string, data: Partial<IProjectManagementPlan>) => {
    await updatePlanMutation.mutateAsync({ projectCode, data });
  }, [updatePlanMutation]);

  const submitForApproval = React.useCallback(async (projectCode: string, submittedBy: string) => {
    await submitForApprovalMutation.mutateAsync({ projectCode, submittedBy });
  }, [submitForApprovalMutation]);

  const respondToApproval = React.useCallback(async (projectCode: string, stepId: number, approved: boolean, comment: string) => {
    await respondToApprovalMutation.mutateAsync({ projectCode, stepId, approved, comment });
  }, [respondToApprovalMutation]);

  const signPlan = React.useCallback(async (projectCode: string, signatureId: number, comment: string) => {
    await signPlanMutation.mutateAsync({ projectCode, signatureId, comment });
  }, [signPlanMutation]);

  const canSubmit = React.useMemo(() => {
    if (!pmp) return false;
    if (pmp.status !== 'Draft' && pmp.status !== 'Returned') return false;
    const requiredSigs = pmp.startupSignatures.filter(s => s.isRequired);
    return requiredSigs.every(s => s.status === 'Signed');
  }, [pmp]);

  return { pmp, boilerplate, divisionApprovers, isLoading, error, fetchPlan, updatePlan, submitForApproval, respondToApproval, signPlan, canSubmit };
}
