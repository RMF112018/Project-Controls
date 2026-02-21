import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IMonthlyProjectReview, MonthlyReviewStatus, IMonthlyFollowUp, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { monthlyReviewsOptions } from '../../tanstack/query/queryOptions/monthlyReview';
import { qk } from '../../tanstack/query/queryKeys';

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
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');
  const [currentReview, setCurrentReview] = React.useState<IMonthlyProjectReview | null>(null);

  const reviewsQuery = useQuery(monthlyReviewsOptions(scope, dataService, projectCode));

  const reviews = reviewsQuery.data ?? [];
  const isLoading = reviewsQuery.isLoading;
  const error = reviewsQuery.error?.message ?? null;

  // Auto-select first review when data loads and no review is selected
  React.useEffect(() => {
    if (reviews.length > 0 && !currentReview) {
      setCurrentReview(reviews[0]);
    }
  }, [reviews, currentReview]);

  useSignalRQueryInvalidation({
    entityType: EntityType.MonthlyReview,
    queryKeys: React.useMemo(() => projectCode ? [qk.monthlyReview.byProject(scope, projectCode)] : [], [scope, projectCode]),
    projectCode,
  });

  const broadcastMonthlyReviewChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.MonthlyReview,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const invalidate = React.useCallback(async (code: string) => {
    await queryClient.invalidateQueries({ queryKey: qk.monthlyReview.byProject(scope, code) });
  }, [queryClient, scope]);

  const fetchReviews = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const createReview = React.useCallback(async (data: Partial<IMonthlyProjectReview>) => {
    const created = await dataService.createMonthlyReview(data);
    setCurrentReview(created);
    broadcastMonthlyReviewChange(created.id, 'created', 'Monthly review created');
    await invalidate(projectCode);
    return created;
  }, [dataService, broadcastMonthlyReviewChange, invalidate, projectCode]);

  const updateReview = React.useCallback(async (reviewId: number, data: Partial<IMonthlyProjectReview>) => {
    const updated = await dataService.updateMonthlyReview(reviewId, data);
    if (currentReview?.id === reviewId) setCurrentReview(updated);
    broadcastMonthlyReviewChange(reviewId, 'updated', 'Monthly review updated');
    await invalidate(projectCode);
  }, [dataService, currentReview, broadcastMonthlyReviewChange, invalidate, projectCode]);

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
    if (currentReview?.id === reviewId) setCurrentReview(updated);
    broadcastMonthlyReviewChange(reviewId, 'updated', `Monthly review status advanced to ${newStatus}`);
    dataService.syncToDataMart(updated.projectCode).catch(() => { /* silent */ });
    await invalidate(projectCode);
  }, [dataService, currentReview, broadcastMonthlyReviewChange, invalidate, projectCode]);

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
    broadcastMonthlyReviewChange(reviewId, 'updated', 'Follow-up added to monthly review');
  }, [reviews, updateReview, broadcastMonthlyReviewChange]);

  const selectReview = React.useCallback((reviewId: number) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) setCurrentReview(review);
  }, [reviews]);

  return { reviews, currentReview, isLoading, error, fetchReviews, createReview, updateReview, advanceStatus, addFollowUp, selectReview };
}
