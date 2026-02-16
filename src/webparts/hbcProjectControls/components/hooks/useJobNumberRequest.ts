import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IJobNumberRequest, JobNumberRequestStatus, IProjectType, IStandardCostCode, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseJobNumberRequestResult {
  requests: IJobNumberRequest[];
  projectTypes: IProjectType[];
  costCodes: IStandardCostCode[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: (status?: JobNumberRequestStatus) => Promise<void>;
  fetchRequestByLeadId: (leadId: number) => Promise<IJobNumberRequest | null>;
  createRequest: (data: Partial<IJobNumberRequest>) => Promise<IJobNumberRequest>;
  finalizeJobNumber: (requestId: number, jobNumber: string, assignedBy: string) => Promise<IJobNumberRequest>;
  fetchReferenceData: () => Promise<void>;
}

export function useJobNumberRequest(): IUseJobNumberRequestResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [requests, setRequests] = React.useState<IJobNumberRequest[]>([]);
  const [projectTypes, setProjectTypes] = React.useState<IProjectType[]>([]);
  const [costCodes, setCostCodes] = React.useState<IStandardCostCode[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRequests = React.useCallback(async (status?: JobNumberRequestStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getJobNumberRequests(status);
      setRequests(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job number requests');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Project entity changes
  useSignalR({
    entityType: EntityType.Project,
    onEntityChanged: React.useCallback(() => { fetchRequests(); }, [fetchRequests]),
  });

  const broadcastJobNumberChange = React.useCallback((
    requestId: number,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Project,
      entityId: String(requestId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const fetchRequestByLeadId = React.useCallback(async (leadId: number): Promise<IJobNumberRequest | null> => {
    return dataService.getJobNumberRequestByLeadId(leadId);
  }, [dataService]);

  const createRequest = React.useCallback(async (data: Partial<IJobNumberRequest>): Promise<IJobNumberRequest> => {
    const request = await dataService.createJobNumberRequest(data);
    setRequests(prev => [request, ...prev]);
    broadcastJobNumberChange(request.id, 'created', 'Job number requested');
    return request;
  }, [dataService, broadcastJobNumberChange]);

  const finalizeJobNumber = React.useCallback(async (
    requestId: number,
    jobNumber: string,
    assignedBy: string
  ): Promise<IJobNumberRequest> => {
    const updated = await dataService.finalizeJobNumber(requestId, jobNumber, assignedBy);
    setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    broadcastJobNumberChange(requestId, 'updated', `Job number ${jobNumber} assigned`);
    return updated;
  }, [dataService, broadcastJobNumberChange]);

  const fetchReferenceData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [types, codes] = await Promise.all([
        dataService.getProjectTypes(),
        dataService.getStandardCostCodes(),
      ]);
      setProjectTypes(types);
      setCostCodes(codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reference data');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  return {
    requests,
    projectTypes,
    costCodes,
    isLoading,
    error,
    fetchRequests,
    fetchRequestByLeadId,
    createRequest,
    finalizeJobNumber,
    fetchReferenceData,
  };
}
