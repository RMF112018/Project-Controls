/**
 * Phase 1 Task 1 — Shared composition hook for all Estimating-domain mutations.
 *
 * Centralizes tracker CRUD, kickoff item/parent edits, and post-bid autopsy
 * save/finalize behind useHbcOptimisticMutation with feature-flag gating.
 *
 * Phase 2 Task 3 — Autopsy mutations now fire audit trail entries, notifications,
 * and tracker PostBidStatus sync on success (fire-and-forget, non-blocking).
 * See docs/specs/estimating-post-bid-workflow.md for full workflow spec.
 *
 * Invalidation chain:
 *   Tracker mutation  → qk.estimating.base (cascades to records, log, pursuits, engagements)
 *   Kickoff mutation   → qk.kickoff.byProject + qk.estimating.base
 *   Autopsy mutation   → qk.postBidAutopsy.byProject + qk.postBidAutopsy.base + qk.estimating.base
 *
 * Pattern follows useDataMart.ts composition hook.
 */
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  IEstimatingTracker,
  IEstimatingKickoff,
  IEstimatingKickoffItem,
  IPostBidAutopsy,
} from '@hbc/sp-services';
import {
  AuditAction,
  EntityType,
  NotificationEvent,
  NotificationService,
} from '@hbc/sp-services';
import { useAppContext } from '../../../components/contexts/AppContext';
import { useQueryScope } from '../useQueryScope';
import { qk } from '../queryKeys';
import { OPTIMISTIC_MUTATION_FLAGS } from './optimisticMutationFlags';
import { useHbcOptimisticMutation } from './useHbcOptimisticMutation';
import {
  patchKickoffItem,
  removeKickoffItemOptimistic,
  mergeKickoffOptimistic,
  mergeAutopsyOptimistic,
} from './optimisticPatchers';

// ── Types ──────────────────────────────────────────────────────────────

export interface IUseEstimatingMutationOptions {
  /** Scopes kickoff/autopsy cache keys to this project. */
  projectCode?: string;
}

export interface IUseEstimatingMutationResult {
  // Tracker
  createRecord: (data: Partial<IEstimatingTracker>) => Promise<IEstimatingTracker>;
  updateRecord: (id: number, patch: Partial<IEstimatingTracker>) => Promise<IEstimatingTracker>;
  deleteRecord: (id: number) => Promise<void>;
  // Kickoff
  createKickoff: (data: Partial<IEstimatingKickoff>) => Promise<IEstimatingKickoff>;
  updateKickoff: (id: number, data: Partial<IEstimatingKickoff>) => Promise<IEstimatingKickoff>;
  updateKickoffItem: (kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>) => Promise<IEstimatingKickoffItem>;
  addKickoffItem: (kickoffId: number, item: Partial<IEstimatingKickoffItem>) => Promise<IEstimatingKickoffItem>;
  removeKickoffItem: (kickoffId: number, itemId: number) => Promise<void>;
  // Post-Bid Autopsy
  createAutopsy: (data: Partial<IPostBidAutopsy>) => Promise<IPostBidAutopsy>;
  saveAutopsy: (data: Partial<IPostBidAutopsy>) => Promise<IPostBidAutopsy>;
  finalizeAutopsy: (projectCode: string, data: Partial<IPostBidAutopsy>) => Promise<IPostBidAutopsy>;
  // Status
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isFinalizing: boolean;
  isMutating: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useEstimatingMutation(
  options?: IUseEstimatingMutationOptions,
): IUseEstimatingMutationResult {
  const { dataService, currentUser, selectedProject } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const projectCode = options?.projectCode ?? '';
  const domainFlag = OPTIMISTIC_MUTATION_FLAGS.estimating;

  // Phase 2 Task 3: NotificationService for autopsy lifecycle events
  const notificationService = React.useMemo(
    () => new NotificationService(dataService),
    [dataService],
  );

  // Phase 2 Task 3: Fire-and-forget audit log helper — non-critical, never blocks UI
  const logAudit = React.useCallback(
    (action: AuditAction, entityId: string, details: string, pCode?: string) => {
      void dataService.logAudit({
        Timestamp: new Date().toISOString(),
        Action: action,
        EntityType: EntityType.PostBidAutopsy,
        EntityId: entityId,
        Details: details,
        ProjectCode: pCode ?? projectCode,
        User: currentUser?.email,
      }).catch(() => { /* audit is non-critical */ });
    },
    [dataService, projectCode, currentUser?.email],
  );

  // Phase 2 Task 3: Fire-and-forget tracker PostBidStatus sync
  const syncTrackerStatus = React.useCallback(
    (pCode: string, status: 'InProgress' | 'Completed', autopsyId?: number) => {
      void (async () => {
        try {
          const records = await dataService.getEstimatingRecords({
            filter: `ProjectCode eq '${pCode}'`,
          } as unknown as import('@hbc/sp-services').IListQueryOptions);
          const items = (records as unknown as { items?: IEstimatingTracker[] }).items;
          const tracker = items?.[0] ?? (Array.isArray(records) ? (records as unknown as IEstimatingTracker[])[0] : undefined);
          if (tracker) {
            const patch: Partial<IEstimatingTracker> = { PostBidStatus: status };
            if (autopsyId !== undefined) patch.PostBidAutopsyId = autopsyId;
            await dataService.updateEstimatingRecord(tracker.id, patch);
          }
        } catch { /* tracker sync is non-critical */ }
      })();
    },
    [dataService],
  );

  // ── Invalidation helpers ────────────────────────────────────────────

  const invalidateEstimatingDomain = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) });
  }, [queryClient, scope]);

  const invalidateKickoff = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.kickoff.byProject(scope, projectCode) }),
      queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) }),
    ]);
  }, [queryClient, scope, projectCode]);

  const invalidateAutopsy = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.postBidAutopsy.byProject(scope, projectCode) }),
      queryClient.invalidateQueries({ queryKey: qk.postBidAutopsy.base(scope) }),
      queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) }),
    ]);
  }, [queryClient, scope, projectCode]);

  // ── Tracker: create ─────────────────────────────────────────────────
  // Tracker mutations use pessimistic path (invalidation-only) because the
  // broadcast-patch pattern (updating log, pursuits, engagements simultaneously)
  // doesn't fit useHbcOptimisticMutation's single-key model. Consumers like
  // DepartmentTrackingPage that need tab-specific optimistic inserts can layer
  // their own onMutate logic on top of these stable callbacks.

  const createRecordMutation = useHbcOptimisticMutation<
    IEstimatingTracker,
    Partial<IEstimatingTracker>,
    unknown
  >({
    method: 'createEstimatingRecord',
    domainFlag,
    mutationFn: (data) => dataService.createEstimatingRecord(data),
    onSettledEffects: invalidateEstimatingDomain,
  });

  // ── Tracker: update ─────────────────────────────────────────────────

  const updateRecordMutation = useHbcOptimisticMutation<
    IEstimatingTracker,
    { id: number; patch: Partial<IEstimatingTracker> },
    unknown
  >({
    method: 'updateEstimatingRecord',
    domainFlag,
    mutationFn: ({ id, patch }) => dataService.updateEstimatingRecord(id, patch),
    onSettledEffects: invalidateEstimatingDomain,
  });

  // ── Tracker: delete ─────────────────────────────────────────────────

  const deleteRecordMutation = useHbcOptimisticMutation<
    void,
    number,
    unknown
  >({
    method: 'deleteEstimatingRecord',
    domainFlag,
    mutationFn: (id) => dataService.deleteEstimatingRecord(id),
    onSettledEffects: invalidateEstimatingDomain,
  });

  // ── Kickoff: create ─────────────────────────────────────────────────

  const createKickoffMutation = useHbcOptimisticMutation<
    IEstimatingKickoff,
    Partial<IEstimatingKickoff>,
    unknown
  >({
    method: 'createEstimatingKickoff',
    domainFlag,
    mutationFn: (data) => dataService.createEstimatingKickoff(data),
    onSettledEffects: invalidateKickoff,
  });

  // ── Kickoff: update parent ──────────────────────────────────────────

  const updateKickoffMutation = useHbcOptimisticMutation<
    IEstimatingKickoff,
    { id: number; data: Partial<IEstimatingKickoff> },
    IEstimatingKickoff | null | undefined
  >({
    method: 'updateEstimatingKickoff',
    domainFlag,
    mutationFn: ({ id, data }) => dataService.updateEstimatingKickoff(id, data),
    getStateKey: () => qk.kickoff.byProject(scope, projectCode),
    applyOptimistic: (previous, { data }) => {
      if (!previous) return previous;
      return mergeKickoffOptimistic(previous, data);
    },
    onSettledEffects: invalidateKickoff,
  });

  // ── Kickoff: update item ────────────────────────────────────────────

  const updateKickoffItemMutation = useHbcOptimisticMutation<
    IEstimatingKickoffItem,
    { kickoffId: number; itemId: number; data: Partial<IEstimatingKickoffItem> },
    IEstimatingKickoff | null | undefined
  >({
    method: 'updateKickoffItem',
    domainFlag,
    mutationFn: ({ kickoffId, itemId, data }) =>
      dataService.updateKickoffItem(kickoffId, itemId, data),
    getStateKey: () => qk.kickoff.byProject(scope, projectCode),
    applyOptimistic: (previous, { itemId, data }) => {
      if (!previous) return previous;
      return patchKickoffItem(previous, itemId, data);
    },
    onSettledEffects: invalidateKickoff,
  });

  // ── Kickoff: add item ───────────────────────────────────────────────

  const addKickoffItemMutation = useHbcOptimisticMutation<
    IEstimatingKickoffItem,
    { kickoffId: number; item: Partial<IEstimatingKickoffItem> },
    unknown
  >({
    method: 'addKickoffItem',
    domainFlag,
    mutationFn: ({ kickoffId, item }) => dataService.addKickoffItem(kickoffId, item),
    onSettledEffects: invalidateKickoff,
  });

  // ── Kickoff: remove item ────────────────────────────────────────────

  const removeKickoffItemMutation = useHbcOptimisticMutation<
    void,
    { kickoffId: number; itemId: number },
    IEstimatingKickoff | null | undefined
  >({
    method: 'removeKickoffItem',
    domainFlag,
    mutationFn: ({ kickoffId, itemId }) =>
      dataService.removeKickoffItem(kickoffId, itemId),
    getStateKey: () => qk.kickoff.byProject(scope, projectCode),
    applyOptimistic: (previous, { itemId }) => {
      if (!previous) return previous;
      return removeKickoffItemOptimistic(previous, itemId);
    },
    onSettledEffects: invalidateKickoff,
  });

  // ── Autopsy: create ─────────────────────────────────────────────────
  // Phase 2 Task 3: On success → audit, notification, tracker status sync

  const createAutopsyMutation = useHbcOptimisticMutation<
    IPostBidAutopsy,
    Partial<IPostBidAutopsy>,
    unknown
  >({
    method: 'createPostBidAutopsy',
    domainFlag,
    mutationFn: (data) => dataService.createPostBidAutopsy(data),
    onSuccessEffects: (result) => {
      logAudit(
        AuditAction.AutopsyCreated,
        String(result.id),
        `Post-Bid Autopsy initialized for project ${result.ProjectCode}`,
        result.ProjectCode,
      );
      void notificationService.notify(
        NotificationEvent.PostBidAutopsyCreated,
        { projectCode: result.ProjectCode, leadTitle: selectedProject?.projectName },
        currentUser?.email ?? 'system',
      ).catch(() => { /* notification is non-critical */ });
      syncTrackerStatus(result.ProjectCode, 'InProgress', result.id);
    },
    onSettledEffects: invalidateAutopsy,
  });

  // ── Autopsy: save (optimistic merge) ────────────────────────────────
  // Phase 2 Task 3: On success → audit trail entry for field updates

  const saveAutopsyMutation = useHbcOptimisticMutation<
    IPostBidAutopsy,
    Partial<IPostBidAutopsy>,
    IPostBidAutopsy | null | undefined
  >({
    method: 'savePostBidAutopsy',
    domainFlag,
    mutationFn: (data) => dataService.savePostBidAutopsy(data),
    getStateKey: () => qk.postBidAutopsy.byProject(scope, projectCode),
    applyOptimistic: (previous, data) => {
      if (!previous) return previous;
      return mergeAutopsyOptimistic(previous, data);
    },
    onSuccessEffects: (result) => {
      logAudit(
        AuditAction.AutopsyUpdated,
        String(result.id),
        `Post-Bid Autopsy updated for project ${projectCode}`,
      );
    },
    onSettledEffects: invalidateAutopsy,
  });

  // ── Autopsy: finalize ───────────────────────────────────────────────
  // Phase 2 Task 3: On success → audit, notification, tracker status 'Completed'

  const finalizeAutopsyMutation = useHbcOptimisticMutation<
    IPostBidAutopsy,
    { pCode: string; data: Partial<IPostBidAutopsy> },
    unknown
  >({
    method: 'finalizePostBidAutopsy',
    domainFlag,
    mutationFn: ({ pCode, data }) => dataService.finalizePostBidAutopsy(pCode, data),
    onSuccessEffects: (result, { pCode }) => {
      logAudit(
        AuditAction.AutopsyCompleted,
        String(result.id),
        `Post-Bid Autopsy finalized for project ${pCode}`,
        pCode,
      );
      void notificationService.notify(
        NotificationEvent.AutopsyFinalized,
        {
          projectCode: pCode,
          leadTitle: selectedProject?.projectName,
          processScore: result.processScore,
          overallRating: result.overallRating,
        },
        currentUser?.email ?? 'system',
      ).catch(() => { /* notification is non-critical */ });
      syncTrackerStatus(pCode, 'Completed');
    },
    onSettledEffects: invalidateAutopsy,
  });

  // ── Stable callback wrappers ────────────────────────────────────────

  const createRecord = React.useCallback(
    (data: Partial<IEstimatingTracker>) => createRecordMutation.mutateAsync(data),
    [createRecordMutation],
  );

  const updateRecord = React.useCallback(
    (id: number, patch: Partial<IEstimatingTracker>) =>
      updateRecordMutation.mutateAsync({ id, patch }),
    [updateRecordMutation],
  );

  const deleteRecord = React.useCallback(
    (id: number) => deleteRecordMutation.mutateAsync(id),
    [deleteRecordMutation],
  );

  const createKickoff = React.useCallback(
    (data: Partial<IEstimatingKickoff>) => createKickoffMutation.mutateAsync(data),
    [createKickoffMutation],
  );

  const updateKickoff = React.useCallback(
    (id: number, data: Partial<IEstimatingKickoff>) =>
      updateKickoffMutation.mutateAsync({ id, data }),
    [updateKickoffMutation],
  );

  const updateKickoffItemCb = React.useCallback(
    (kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>) =>
      updateKickoffItemMutation.mutateAsync({ kickoffId, itemId, data }),
    [updateKickoffItemMutation],
  );

  const addKickoffItemCb = React.useCallback(
    (kickoffId: number, item: Partial<IEstimatingKickoffItem>) =>
      addKickoffItemMutation.mutateAsync({ kickoffId, item }),
    [addKickoffItemMutation],
  );

  const removeKickoffItemCb = React.useCallback(
    (kickoffId: number, itemId: number) =>
      removeKickoffItemMutation.mutateAsync({ kickoffId, itemId }),
    [removeKickoffItemMutation],
  );

  const createAutopsy = React.useCallback(
    (data: Partial<IPostBidAutopsy>) => createAutopsyMutation.mutateAsync(data),
    [createAutopsyMutation],
  );

  const saveAutopsy = React.useCallback(
    (data: Partial<IPostBidAutopsy>) => saveAutopsyMutation.mutateAsync(data),
    [saveAutopsyMutation],
  );

  const finalizeAutopsy = React.useCallback(
    (pCode: string, data: Partial<IPostBidAutopsy>) =>
      finalizeAutopsyMutation.mutateAsync({ pCode, data }),
    [finalizeAutopsyMutation],
  );

  // ── Status aggregation ──────────────────────────────────────────────

  const isCreating =
    createRecordMutation.isPending ||
    createKickoffMutation.isPending ||
    createAutopsyMutation.isPending;

  const isUpdating =
    updateRecordMutation.isPending ||
    updateKickoffMutation.isPending ||
    updateKickoffItemMutation.isPending ||
    addKickoffItemMutation.isPending ||
    removeKickoffItemMutation.isPending ||
    saveAutopsyMutation.isPending ||
    finalizeAutopsyMutation.isPending;

  const isDeleting = deleteRecordMutation.isPending;
  const isFinalizing = finalizeAutopsyMutation.isPending;
  const isMutating = isCreating || isUpdating || isDeleting;

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    createKickoff,
    updateKickoff,
    updateKickoffItem: updateKickoffItemCb,
    addKickoffItem: addKickoffItemCb,
    removeKickoffItem: removeKickoffItemCb,
    createAutopsy,
    saveAutopsy,
    finalizeAutopsy,
    isCreating,
    isUpdating,
    isDeleting,
    isFinalizing,
    isMutating,
  };
}
