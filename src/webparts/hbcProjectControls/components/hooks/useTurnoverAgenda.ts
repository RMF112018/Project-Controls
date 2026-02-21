import {
  ITurnoverAgenda,
  ITurnoverPrerequisite,
  ITurnoverDiscussionItem,
  ITurnoverSubcontractor,
  ITurnoverExhibit,
  ITurnoverEstimateOverview,
  ITurnoverAttachment,
  IResolvedWorkflowStep,
  EntityType,
  IEntityChangedMessage,
} from '@hbc/sp-services';
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { turnoverAgendaOptions, turnoverWorkflowChainOptions } from '../../tanstack/query/queryOptions/turnover';
import { qk } from '../../tanstack/query/queryKeys';

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
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const agendaQuery = useQuery(turnoverAgendaOptions(scope, dataService, projectCode));
  const chainQuery = useQuery(turnoverWorkflowChainOptions(scope, dataService, projectCode));

  const agenda = agendaQuery.data ?? null;
  const resolvedChain = chainQuery.data ?? [];
  const loading = agendaQuery.isLoading || chainQuery.isLoading;
  const error = agendaQuery.error?.message ?? chainQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.TurnoverAgenda,
    queryKeys: React.useMemo(() => projectCode ? [qk.turnover.byProject(scope, projectCode), qk.turnover.workflowChain(scope, projectCode)] : [], [scope, projectCode]),
  });

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
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const invalidate = React.useCallback(async () => {
    if (projectCode) {
      await queryClient.invalidateQueries({ queryKey: qk.turnover.byProject(scope, projectCode) });
    }
  }, [queryClient, scope, projectCode]);

  const fetchAgenda = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const createAgenda = React.useCallback(async (code: string, leadId: number) => {
    await dataService.createTurnoverAgenda(code, leadId);
    broadcastTurnoverChange(code, 'created', 'Turnover agenda created');
    setProjectCode(code);
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const updateAgenda = React.useCallback(async (code: string, data: Partial<ITurnoverAgenda>) => {
    await dataService.updateTurnoverAgenda(code, data);
    broadcastTurnoverChange(code, 'updated', 'Turnover agenda updated');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const updateEstimateOverview = React.useCallback(async (code: string, data: Partial<ITurnoverEstimateOverview>) => {
    await dataService.updateTurnoverEstimateOverview(code, data);
    broadcastTurnoverChange(code, 'updated', 'Estimate overview updated');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const togglePrerequisite = React.useCallback(async (prerequisiteId: number, completed: boolean) => {
    const updates: Partial<ITurnoverPrerequisite> = {
      completed,
      completedBy: completed ? 'Current User' : undefined,
      completedDate: completed ? new Date().toISOString() : undefined,
    };
    await dataService.updateTurnoverPrerequisite(prerequisiteId, updates);
    broadcastTurnoverChange(prerequisiteId, 'updated', `Prerequisite ${completed ? 'completed' : 'uncompleted'}`);
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const updateDiscussionItem = React.useCallback(async (itemId: number, data: Partial<ITurnoverDiscussionItem>) => {
    await dataService.updateTurnoverDiscussionItem(itemId, data);
    broadcastTurnoverChange(itemId, 'updated', 'Discussion item updated');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const addDiscussionAttachment = React.useCallback(async (itemId: number, file: File): Promise<ITurnoverAttachment> => {
    const result = await dataService.addTurnoverDiscussionAttachment(itemId, file);
    broadcastTurnoverChange(itemId, 'updated', 'Discussion attachment added');
    await invalidate();
    return result;
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const removeDiscussionAttachment = React.useCallback(async (attachmentId: number) => {
    await dataService.removeTurnoverDiscussionAttachment(attachmentId);
    broadcastTurnoverChange(attachmentId, 'deleted', 'Discussion attachment removed');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const addSubcontractor = React.useCallback(async (turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>) => {
    await dataService.addTurnoverSubcontractor(turnoverAgendaId, data);
    broadcastTurnoverChange(turnoverAgendaId, 'created', 'Subcontractor added');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const updateSubcontractor = React.useCallback(async (subId: number, data: Partial<ITurnoverSubcontractor>) => {
    await dataService.updateTurnoverSubcontractor(subId, data);
    broadcastTurnoverChange(subId, 'updated', 'Subcontractor updated');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const removeSubcontractor = React.useCallback(async (subId: number) => {
    await dataService.removeTurnoverSubcontractor(subId);
    broadcastTurnoverChange(subId, 'deleted', 'Subcontractor removed');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const updateExhibit = React.useCallback(async (exhibitId: number, data: Partial<ITurnoverExhibit>) => {
    await dataService.updateTurnoverExhibit(exhibitId, data);
    broadcastTurnoverChange(exhibitId, 'updated', 'Exhibit updated');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const addExhibit = React.useCallback(async (turnoverAgendaId: number, data: Partial<ITurnoverExhibit>) => {
    await dataService.addTurnoverExhibit(turnoverAgendaId, data);
    broadcastTurnoverChange(turnoverAgendaId, 'created', 'Exhibit added');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const removeExhibit = React.useCallback(async (exhibitId: number) => {
    await dataService.removeTurnoverExhibit(exhibitId);
    broadcastTurnoverChange(exhibitId, 'deleted', 'Exhibit removed');
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate]);

  const uploadExhibitFile = React.useCallback(async (exhibitId: number, file: File) => {
    await dataService.uploadTurnoverExhibitFile(exhibitId, file);
    await invalidate();
  }, [dataService, invalidate]);

  const sign = React.useCallback(async (signatureId: number, comment?: string) => {
    await dataService.signTurnoverAgenda(signatureId, comment);
    broadcastTurnoverChange(signatureId, 'updated', 'Turnover agenda signed');
    if (projectCode) {
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
    }
    await invalidate();
  }, [dataService, broadcastTurnoverChange, invalidate, projectCode]);

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
