import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IProjectManagementPlan, IDivisionApprover, IPMPBoilerplateSection, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

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
  const [pmp, setPmp] = React.useState<IProjectManagementPlan | null>(null);
  const [boilerplate, setBoilerplate] = React.useState<IPMPBoilerplateSection[]>([]);
  const [divisionApprovers, setDivisionApprovers] = React.useState<IDivisionApprover[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

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
      setBoilerplate(boilerplateResult);
      setDivisionApprovers(approversResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PMP');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

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

  const updatePlan = React.useCallback(async (projectCode: string, data: Partial<IProjectManagementPlan>) => {
    const updated = await dataService.updateProjectManagementPlan(projectCode, data);
    setPmp(updated);
    broadcastPMPChange(projectCode, 'updated', 'PMP updated');
  }, [dataService, broadcastPMPChange]);

  const submitForApproval = React.useCallback(async (projectCode: string, submittedBy: string) => {
    const updated = await dataService.submitPMPForApproval(projectCode, submittedBy);
    setPmp(updated);
    broadcastPMPChange(projectCode, 'updated', 'PMP submitted for approval');
  }, [dataService, broadcastPMPChange]);

  const respondToApproval = React.useCallback(async (projectCode: string, stepId: number, approved: boolean, comment: string) => {
    const updated = await dataService.respondToPMPApproval(projectCode, stepId, approved, comment);
    setPmp(updated);
    broadcastPMPChange(projectCode, 'updated', `PMP approval ${approved ? 'approved' : 'rejected'}`);
  }, [dataService, broadcastPMPChange]);

  const signPlan = React.useCallback(async (projectCode: string, signatureId: number, comment: string) => {
    const updated = await dataService.signPMP(projectCode, signatureId, comment);
    setPmp(updated);
    broadcastPMPChange(projectCode, 'updated', 'PMP signed');
  }, [dataService, broadcastPMPChange]);

  const canSubmit = React.useMemo(() => {
    if (!pmp) return false;
    if (pmp.status !== 'Draft' && pmp.status !== 'Returned') return false;
    const requiredSigs = pmp.startupSignatures.filter(s => s.isRequired);
    return requiredSigs.every(s => s.status === 'Signed');
  }, [pmp]);

  return { pmp, boilerplate, divisionApprovers, isLoading, error, fetchPlan, updatePlan, submitForApproval, respondToApproval, signPlan, canSubmit };
}
