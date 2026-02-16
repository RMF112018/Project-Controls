import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { ILossAutopsy, ILead, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUsePostBidAutopsyResult {
  autopsy: ILossAutopsy | null;
  allAutopsies: ILossAutopsy[];
  lead: ILead | null;
  isLoading: boolean;
  error: string | null;
  fetchAutopsy: (leadId: number) => Promise<void>;
  fetchAllAutopsies: () => Promise<void>;
  saveAutopsy: (data: Partial<ILossAutopsy>) => Promise<ILossAutopsy>;
  finalizeAutopsy: (leadId: number, data: Partial<ILossAutopsy>) => Promise<ILossAutopsy>;
  isFinalized: (leadId: number) => Promise<boolean>;
  pushToLessonsLearned: (autopsy: ILossAutopsy, projectCode: string) => Promise<void>;
}

export function usePostBidAutopsy(): IUsePostBidAutopsyResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [autopsy, setAutopsy] = React.useState<ILossAutopsy | null>(null);
  const [allAutopsies, setAllAutopsies] = React.useState<ILossAutopsy[]>([]);
  const [lead, setLead] = React.useState<ILead | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAllAutopsies = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getAllLossAutopsies();
      setAllAutopsies(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch autopsies');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Lead entity changes (autopsies are lead-associated)
  useSignalR({
    entityType: EntityType.Lead,
    onEntityChanged: React.useCallback(() => { fetchAllAutopsies(); }, [fetchAllAutopsies]),
  });

  const broadcastAutopsyChange = React.useCallback((
    leadId: number,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Lead,
      entityId: String(leadId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const fetchAutopsy = React.useCallback(async (leadId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const [autopsyData, leadData] = await Promise.all([
        dataService.getLossAutopsy(leadId),
        dataService.getLeadById(leadId),
      ]);
      setAutopsy(autopsyData);
      setLead(leadData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch autopsy');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const saveAutopsy = React.useCallback(async (data: Partial<ILossAutopsy>): Promise<ILossAutopsy> => {
    const saved = await dataService.saveLossAutopsy(data);
    setAutopsy(saved);
    broadcastAutopsyChange(saved.leadId, 'updated', 'Autopsy saved');
    return saved;
  }, [dataService, broadcastAutopsyChange]);

  const finalizeAutopsy = React.useCallback(async (leadId: number, data: Partial<ILossAutopsy>): Promise<ILossAutopsy> => {
    const finalized = await dataService.finalizeLossAutopsy(leadId, data);
    setAutopsy(finalized);
    broadcastAutopsyChange(leadId, 'updated', 'Autopsy finalized');
    return finalized;
  }, [dataService, broadcastAutopsyChange]);

  const isFinalized = React.useCallback(async (leadId: number): Promise<boolean> => {
    return dataService.isAutopsyFinalized(leadId);
  }, [dataService]);

  const pushToLessonsLearned = React.useCallback(async (autopsyData: ILossAutopsy, projectCode: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const user = await dataService.getCurrentUser();
    const raisedBy = user?.email ?? 'system';

    // Push weaknesses as Negative lessons
    if (autopsyData.weaknesses && autopsyData.weaknesses.trim()) {
      await dataService.addLessonLearned(projectCode, {
        title: `Post-Bid Autopsy: Weaknesses — Lead #${autopsyData.leadId}`,
        category: 'Preconstruction',
        impact: 'Negative',
        description: autopsyData.weaknesses,
        recommendation: autopsyData.rootCauseAnalysis ?? '',
        raisedBy,
        raisedDate: today,
        phase: 'Preconstruction',
        isIncludedInFinalRecord: true,
        tags: ['post-bid-autopsy', 'weakness'],
      });
    }

    // Push opportunities as Positive lessons
    if (autopsyData.opportunities && autopsyData.opportunities.trim()) {
      await dataService.addLessonLearned(projectCode, {
        title: `Post-Bid Autopsy: Opportunities — Lead #${autopsyData.leadId}`,
        category: 'Preconstruction',
        impact: 'Positive',
        description: autopsyData.opportunities,
        recommendation: '',
        raisedBy,
        raisedDate: today,
        phase: 'Preconstruction',
        isIncludedInFinalRecord: true,
        tags: ['post-bid-autopsy', 'opportunity'],
      });
    }

    broadcastAutopsyChange(autopsyData.leadId, 'updated', 'Lessons pushed from autopsy');
  }, [dataService, broadcastAutopsyChange]);

  return {
    autopsy,
    allAutopsies,
    lead,
    isLoading,
    error,
    fetchAutopsy,
    fetchAllAutopsies,
    saveAutopsy,
    finalizeAutopsy,
    isFinalized,
    pushToLessonsLearned,
  };
}
