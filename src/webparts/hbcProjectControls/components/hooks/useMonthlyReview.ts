import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IMonthlyProjectReview, MonthlyReviewStatus, IMonthlyFollowUp } from '@hbc/sp-services';

interface IUseMonthlyReviewResult {
  reviews: IMonthlyProjectReview[];
  currentReview: IMonthlyProjectReview | null;
  isLoading: boolean;
  error: string | null;
  fetchReviews: (projectCode: string) => Promise<void>;
  createReview: (data: Partial<IMonthlyProjectReview>) => Promise<IMonthlyProjectReview>;
  updateReview: (reviewId: number, data: Partial<IMonthlyProjectReview>) => Promise<void>;
  advanceStatus: (reviewId: number, newStatus: MonthlyReviewStatus) => Promise<void>;
  addFollowUp: (reviewId: number, followUp: Partial<IMonthlyFollowUp>) => Promise<void>;
  selectReview: (reviewId: number) => void;
}

export function useMonthlyReview(): IUseMonthlyReviewResult {
  const { dataService } = useAppContext();
  const [reviews, setReviews] = React.useState<IMonthlyProjectReview[]>([]);
  const [currentReview, setCurrentReview] = React.useState<IMonthlyProjectReview | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReviews = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getMonthlyReviews(projectCode);
      setReviews(result);
      if (result.length > 0 && !currentReview) {
        setCurrentReview(result[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly reviews');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentReview]);

  const createReview = React.useCallback(async (data: Partial<IMonthlyProjectReview>) => {
    const created = await dataService.createMonthlyReview(data);
    setReviews(prev => [created, ...prev]);
    setCurrentReview(created);
    return created;
  }, [dataService]);

  const updateReview = React.useCallback(async (reviewId: number, data: Partial<IMonthlyProjectReview>) => {
    const updated = await dataService.updateMonthlyReview(reviewId, data);
    setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    if (currentReview?.id === reviewId) setCurrentReview(updated);
  }, [dataService, currentReview]);

  const advanceStatus = React.useCallback(async (reviewId: number, newStatus: MonthlyReviewStatus) => {
    const statusDateMap: Partial<Record<MonthlyReviewStatus, string>> = {
      PendingPXReview: 'pmSubmittedDate',
      PXReviewComplete: 'pxReviewDate',
      PendingPXValidation: 'pxValidationDate',
      SubmittedToLeadership: 'leadershipSubmitDate',
      Complete: 'completedDate',
    };
    const dateField = statusDateMap[newStatus];
    const updateData: Partial<IMonthlyProjectReview> = { status: newStatus };
    if (dateField) {
      (updateData as Record<string, unknown>)[dateField] = new Date().toISOString();
    }
    const updated = await dataService.updateMonthlyReview(reviewId, updateData);
    setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    if (currentReview?.id === reviewId) setCurrentReview(updated);
    // Fire-and-forget — sync Data Mart after monthly review status change
    dataService.syncToDataMart(updated.projectCode).catch(() => { /* silent */ });
  }, [dataService, currentReview]);

  const addFollowUp = React.useCallback(async (reviewId: number, followUp: Partial<IMonthlyFollowUp>) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const newFollowUp: IMonthlyFollowUp = {
      id: Date.now(),
      question: followUp.question ?? '',
      requestedBy: followUp.requestedBy ?? '',
      requestedDate: followUp.requestedDate ?? new Date().toISOString().split('T')[0],
      pmResponse: '',
      responseDate: null,
      pxForwardedDate: null,
      status: 'Open',
    };
    const updatedFollowUps = [...review.followUps, newFollowUp];
    await updateReview(reviewId, { followUps: updatedFollowUps });
  }, [reviews, updateReview]);

  const selectReview = React.useCallback((reviewId: number) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) setCurrentReview(review);
  }, [reviews]);

  return { reviews, currentReview, isLoading, error, fetchReviews, createReview, updateReview, advanceStatus, addFollowUp, selectReview };
}
