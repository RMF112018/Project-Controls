import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IGoNoGoScorecard, GoNoGoDecision } from '../../models';

interface IUseGoNoGoResult {
  scorecards: IGoNoGoScorecard[];
  isLoading: boolean;
  error: string | null;
  fetchScorecards: () => Promise<void>;
  getScorecardByLeadId: (leadId: number) => Promise<IGoNoGoScorecard | null>;
  createScorecard: (data: Partial<IGoNoGoScorecard>) => Promise<IGoNoGoScorecard>;
  updateScorecard: (id: number, data: Partial<IGoNoGoScorecard>) => Promise<IGoNoGoScorecard>;
  submitDecision: (scorecardId: number, decision: GoNoGoDecision, projectCode?: string) => Promise<void>;
}

export function useGoNoGo(): IUseGoNoGoResult {
  const { dataService } = useAppContext();
  const [scorecards, setScorecards] = React.useState<IGoNoGoScorecard[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchScorecards = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getScorecards();
      setScorecards(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scorecards');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const getScorecardByLeadId = React.useCallback(async (leadId: number) => {
    return dataService.getScorecardByLeadId(leadId);
  }, [dataService]);

  const createScorecard = React.useCallback(async (data: Partial<IGoNoGoScorecard>) => {
    const scorecard = await dataService.createScorecard(data);
    setScorecards(prev => [...prev, scorecard]);
    return scorecard;
  }, [dataService]);

  const updateScorecard = React.useCallback(async (id: number, data: Partial<IGoNoGoScorecard>) => {
    const updated = await dataService.updateScorecard(id, data);
    setScorecards(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, [dataService]);

  const submitDecision = React.useCallback(async (scorecardId: number, decision: GoNoGoDecision, projectCode?: string) => {
    await dataService.submitGoNoGoDecision(scorecardId, decision, projectCode);
    await fetchScorecards();
  }, [dataService, fetchScorecards]);

  return { scorecards, isLoading, error, fetchScorecards, getScorecardByLeadId, createScorecard, updateScorecard, submitDecision };
}
