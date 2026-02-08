import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ILossAutopsy } from '../../models/ILossAutopsy';
import { ILead } from '../../models/ILead';

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
  const { dataService } = useAppContext();
  const [autopsy, setAutopsy] = React.useState<ILossAutopsy | null>(null);
  const [allAutopsies, setAllAutopsies] = React.useState<ILossAutopsy[]>([]);
  const [lead, setLead] = React.useState<ILead | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const saveAutopsy = React.useCallback(async (data: Partial<ILossAutopsy>): Promise<ILossAutopsy> => {
    const saved = await dataService.saveLossAutopsy(data);
    setAutopsy(saved);
    return saved;
  }, [dataService]);

  const finalizeAutopsy = React.useCallback(async (leadId: number, data: Partial<ILossAutopsy>): Promise<ILossAutopsy> => {
    const finalized = await dataService.finalizeLossAutopsy(leadId, data);
    setAutopsy(finalized);
    return finalized;
  }, [dataService]);

  const isFinalized = React.useCallback(async (leadId: number): Promise<boolean> => {
    return dataService.isAutopsyFinalized(leadId);
  }, [dataService]);

  const pushToLessonsLearned = React.useCallback(async (autopsyData: ILossAutopsy, projectCode: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const currentUser = await dataService.getCurrentUser();
    const raisedBy = currentUser?.email ?? 'system';

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
  }, [dataService]);

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
