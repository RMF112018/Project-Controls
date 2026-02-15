import {
  ITurnoverAgenda,
  ITurnoverPrerequisite,
  ITurnoverDiscussionItem,
  ITurnoverSubcontractor,
  ITurnoverExhibit,
  ITurnoverEstimateOverview,
  ITurnoverAttachment,
  IResolvedWorkflowStep,
  WorkflowKey,
  EntityType,
  IEntityChangedMessage,
} from '@hbc/sp-services';
import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';

interface IUseTurnoverAgendaResult {
  agenda: ITurnoverAgenda | null;
  resolvedChain: IResolvedWorkflowStep[];
  loading: boolean;
  error: string | null;
  // Computed
  prerequisitesComplete: boolean;
  allItemsDiscussed: boolean;
  allExhibitsReviewed: boolean;
  allSignaturesSigned: boolean;
  completionPercentage: number;
  // CRUD
  fetchAgenda: (projectCode: string) => Promise<void>;
  createAgenda: (projectCode: string, leadId: number) => Promise<void>;
  updateAgenda: (projectCode: string, data: Partial<ITurnoverAgenda>) => Promise<void>;
  updateEstimateOverview: (projectCode: string, data: Partial<ITurnoverEstimateOverview>) => Promise<void>;
  togglePrerequisite: (prerequisiteId: number, completed: boolean) => Promise<void>;
  updateDiscussionItem: (itemId: number, data: Partial<ITurnoverDiscussionItem>) => Promise<void>;
  addDiscussionAttachment: (itemId: number, file: File) => Promise<ITurnoverAttachment>;
  removeDiscussionAttachment: (attachmentId: number) => Promise<void>;
  addSubcontractor: (turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>) => Promise<void>;
  updateSubcontractor: (subId: number, data: Partial<ITurnoverSubcontractor>) => Promise<void>;
  removeSubcontractor: (subId: number) => Promise<void>;
  updateExhibit: (exhibitId: number, data: Partial<ITurnoverExhibit>) => Promise<void>;
  addExhibit: (turnoverAgendaId: number, data: Partial<ITurnoverExhibit>) => Promise<void>;
  removeExhibit: (exhibitId: number) => Promise<void>;
  uploadExhibitFile: (exhibitId: number, file: File) => Promise<void>;
  sign: (signatureId: number, comment?: string) => Promise<void>;
}

export function useTurnoverAgenda(): IUseTurnoverAgendaResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [agenda, setAgenda] = React.useState<ITurnoverAgenda | null>(null);
  const [resolvedChain, setResolvedChain] = React.useState<IResolvedWorkflowStep[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchAgenda = React.useCallback(async (projectCode: string) => {
    try {
      setLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const [agendaResult, chainResult] = await Promise.all([
        dataService.getTurnoverAgenda(projectCode),
        dataService.resolveWorkflowChain(WorkflowKey.TURNOVER_APPROVAL, projectCode),
      ]);
      setAgenda(agendaResult);
      setResolvedChain(chainResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch turnover agenda');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on TurnoverAgenda entity changes from other users
  useSignalR({
    entityType: EntityType.TurnoverAgenda,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchAgenda(lastProjectCodeRef.current);
      }
    }, [fetchAgenda]),
  });

  // Helper to broadcast turnover agenda changes
  const broadcastTurnoverChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.TurnoverAgenda,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const createAgenda = React.useCallback(async (projectCode: string, leadId: number) => {
    const result = await dataService.createTurnoverAgenda(projectCode, leadId);
    setAgenda(result);
    broadcastTurnoverChange(projectCode, 'created', 'Turnover agenda created');
  }, [dataService, broadcastTurnoverChange]);

  const updateAgenda = React.useCallback(async (projectCode: string, data: Partial<ITurnoverAgenda>) => {
    const result = await dataService.updateTurnoverAgenda(projectCode, data);
    setAgenda(result);
    broadcastTurnoverChange(projectCode, 'updated', 'Turnover agenda updated');
  }, [dataService, broadcastTurnoverChange]);

  const updateEstimateOverview = React.useCallback(async (projectCode: string, data: Partial<ITurnoverEstimateOverview>) => {
    await dataService.updateTurnoverEstimateOverview(projectCode, data);
    const refreshed = await dataService.getTurnoverAgenda(projectCode);
    setAgenda(refreshed);
    broadcastTurnoverChange(projectCode, 'updated', 'Estimate overview updated');
  }, [dataService, broadcastTurnoverChange]);

  const togglePrerequisite = React.useCallback(async (prerequisiteId: number, completed: boolean) => {
    const updates: Partial<ITurnoverPrerequisite> = {
      completed,
      completedBy: completed ? 'Current User' : undefined,
      completedDate: completed ? new Date().toISOString() : undefined,
    };
    await dataService.updateTurnoverPrerequisite(prerequisiteId, updates);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(prerequisiteId, 'updated', `Prerequisite ${completed ? 'completed' : 'uncompleted'}`);
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const updateDiscussionItem = React.useCallback(async (itemId: number, data: Partial<ITurnoverDiscussionItem>) => {
    await dataService.updateTurnoverDiscussionItem(itemId, data);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(itemId, 'updated', 'Discussion item updated');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const addDiscussionAttachment = React.useCallback(async (itemId: number, file: File): Promise<ITurnoverAttachment> => {
    const result = await dataService.addTurnoverDiscussionAttachment(itemId, file);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(itemId, 'updated', 'Discussion attachment added');
    }
    return result;
  }, [dataService, agenda, broadcastTurnoverChange]);

  const removeDiscussionAttachment = React.useCallback(async (attachmentId: number) => {
    await dataService.removeTurnoverDiscussionAttachment(attachmentId);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(attachmentId, 'deleted', 'Discussion attachment removed');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const addSubcontractor = React.useCallback(async (turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>) => {
    await dataService.addTurnoverSubcontractor(turnoverAgendaId, data);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(turnoverAgendaId, 'created', 'Subcontractor added');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const updateSubcontractor = React.useCallback(async (subId: number, data: Partial<ITurnoverSubcontractor>) => {
    await dataService.updateTurnoverSubcontractor(subId, data);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(subId, 'updated', 'Subcontractor updated');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const removeSubcontractor = React.useCallback(async (subId: number) => {
    await dataService.removeTurnoverSubcontractor(subId);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(subId, 'deleted', 'Subcontractor removed');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const updateExhibit = React.useCallback(async (exhibitId: number, data: Partial<ITurnoverExhibit>) => {
    await dataService.updateTurnoverExhibit(exhibitId, data);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(exhibitId, 'updated', 'Exhibit updated');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const addExhibit = React.useCallback(async (turnoverAgendaId: number, data: Partial<ITurnoverExhibit>) => {
    await dataService.addTurnoverExhibit(turnoverAgendaId, data);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(turnoverAgendaId, 'created', 'Exhibit added');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const removeExhibit = React.useCallback(async (exhibitId: number) => {
    await dataService.removeTurnoverExhibit(exhibitId);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(exhibitId, 'deleted', 'Exhibit removed');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  const uploadExhibitFile = React.useCallback(async (exhibitId: number, file: File) => {
    await dataService.uploadTurnoverExhibitFile(exhibitId, file);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
    }
  }, [dataService, agenda]);

  const sign = React.useCallback(async (signatureId: number, comment?: string) => {
    await dataService.signTurnoverAgenda(signatureId, comment);
    if (agenda) {
      const refreshed = await dataService.getTurnoverAgenda(agenda.projectCode);
      setAgenda(refreshed);
      broadcastTurnoverChange(signatureId, 'updated', 'Turnover agenda signed');
    }
  }, [dataService, agenda, broadcastTurnoverChange]);

  // Computed values
  const prerequisitesComplete = React.useMemo(() => {
    if (!agenda || agenda.prerequisites.length === 0) return false;
    return agenda.prerequisites.every(p => p.completed);
  }, [agenda]);

  const allItemsDiscussed = React.useMemo(() => {
    if (!agenda || agenda.discussionItems.length === 0) return false;
    return agenda.discussionItems.every(d => d.discussed);
  }, [agenda]);

  const allExhibitsReviewed = React.useMemo(() => {
    if (!agenda || agenda.exhibits.length === 0) return false;
    return agenda.exhibits.every(e => e.reviewed);
  }, [agenda]);

  const allSignaturesSigned = React.useMemo(() => {
    if (!agenda || agenda.signatures.length === 0) return false;
    return agenda.signatures.every(s => s.signed);
  }, [agenda]);

  const completionPercentage = React.useMemo(() => {
    if (!agenda) return 0;
    const total =
      agenda.prerequisites.length +
      agenda.discussionItems.length +
      agenda.exhibits.length +
      agenda.signatures.length;
    if (total === 0) return 0;
    const done =
      agenda.prerequisites.filter(p => p.completed).length +
      agenda.discussionItems.filter(d => d.discussed).length +
      agenda.exhibits.filter(e => e.reviewed).length +
      agenda.signatures.filter(s => s.signed).length;
    return Math.round((done / total) * 100);
  }, [agenda]);

  return {
    agenda,
    resolvedChain,
    loading,
    error,
    prerequisitesComplete,
    allItemsDiscussed,
    allExhibitsReviewed,
    allSignaturesSigned,
    completionPercentage,
    fetchAgenda,
    createAgenda,
    updateAgenda,
    updateEstimateOverview,
    togglePrerequisite,
    updateDiscussionItem,
    addDiscussionAttachment,
    removeDiscussionAttachment,
    addSubcontractor,
    updateSubcontractor,
    removeSubcontractor,
    updateExhibit,
    addExhibit,
    removeExhibit,
    uploadExhibitFile,
    sign,
  };
}
