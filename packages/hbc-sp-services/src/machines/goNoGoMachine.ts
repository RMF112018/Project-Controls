import { assign, setup } from 'xstate';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../utils/permissions';
import { RoleName, ScorecardStatus } from '../models/enums';
import type { IGoNoGoMachineContext } from './types';

export const ALL_WORKFLOW_ROLES: readonly RoleName[] = Object.values(RoleName) as RoleName[];

const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS);
if (ALL_WORKFLOW_ROLES.length < 16) {
  throw new Error(`goNoGoMachine role coverage must be at least 16; found ${ALL_WORKFLOW_ROLES.length}`);
}
if (ALL_PERMISSION_KEYS.length < 70) {
  throw new Error(`goNoGoMachine guard floor requires >=70 permissions; found ${ALL_PERMISSION_KEYS.length}`);
}

export type GoNoGoStateValue =
  | 'bdDraft'
  | 'awaitingDirectorReview'
  | 'directorReturnedForRevision'
  | 'awaitingCommitteeScoring'
  | 'committeeReturnedForRevision'
  | 'rejected'
  | 'noGo'
  | 'go'
  | 'locked'
  | 'unlocked';

export type GoNoGoEvent =
  | { type: 'SUBMIT_FOR_REVIEW'; actorRole: RoleName }
  | { type: 'DIRECTOR_APPROVE'; actorRole: RoleName }
  | { type: 'DIRECTOR_RETURN'; actorRole: RoleName; reason: string }
  | { type: 'RESUBMIT_AFTER_DIRECTOR'; actorRole: RoleName }
  | { type: 'COMMITTEE_APPROVE'; actorRole: RoleName }
  | { type: 'COMMITTEE_RETURN'; actorRole: RoleName; reason: string }
  | { type: 'COMMITTEE_REJECT'; actorRole: RoleName; reason: string }
  | { type: 'DECIDE_NOGO'; actorRole: RoleName; reason: string }
  | { type: 'RESUBMIT_AFTER_COMMITTEE'; actorRole: RoleName }
  | { type: 'LOCK'; actorRole: RoleName }
  | { type: 'UNLOCK'; actorRole: RoleName; reason: string }
  | { type: 'RELOCK'; actorRole: RoleName };

export interface GoNoGoContext extends IGoNoGoMachineContext {
  onAudit?: (payload: {
    scorecardId: number;
    from: ScorecardStatus;
    to: ScorecardStatus;
    eventType: GoNoGoEvent['type'];
    actorRole: RoleName;
  }) => void;
}

const roleHasPermission = (role: RoleName, permission: string): boolean => {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  return rolePerms.includes(permission);
};

const actorCan = (context: GoNoGoContext, permission: string): boolean => {
  return roleHasPermission(context.actorRole, permission) && context.userPermissions.includes(permission);
};

const goNoGoStatusByState: Record<GoNoGoStateValue, ScorecardStatus> = {
  bdDraft: ScorecardStatus.BDDraft,
  awaitingDirectorReview: ScorecardStatus.AwaitingDirectorReview,
  directorReturnedForRevision: ScorecardStatus.DirectorReturnedForRevision,
  awaitingCommitteeScoring: ScorecardStatus.AwaitingCommitteeScoring,
  committeeReturnedForRevision: ScorecardStatus.CommitteeReturnedForRevision,
  rejected: ScorecardStatus.Rejected,
  noGo: ScorecardStatus.NoGo,
  go: ScorecardStatus.Go,
  locked: ScorecardStatus.Locked,
  unlocked: ScorecardStatus.Unlocked,
};

export const goNoGoMachine = setup({
  types: {
    context: {} as GoNoGoContext,
    events: {} as GoNoGoEvent,
    input: {} as GoNoGoContext,
  },
  guards: {
    canSubmit: ({ context }) => actorCan(context, PERMISSIONS.GONOGO_SUBMIT),
    canReview: ({ context }) => actorCan(context, PERMISSIONS.GONOGO_REVIEW),
    canScore: ({ context }) => actorCan(context, PERMISSIONS.GONOGO_SCORE_COMMITTEE),
    canDecide: ({ context }) => actorCan(context, PERMISSIONS.GONOGO_DECIDE),
    canLock: ({ context }) => actorCan(context, PERMISSIONS.GONOGO_DECIDE),
  },
  actions: {
    auditTransition: ({ context, event }, params: { to: ScorecardStatus }) => {
      context.onAudit?.({
        scorecardId: context.scorecardId,
        from: context.currentStatus,
        to: params.to,
        eventType: event.type,
        actorRole: context.actorRole,
      });
    },
    setCurrentStatus: assign({
      currentStatus: (_, params: { to: ScorecardStatus }) => params.to,
    }),
  },
}).createMachine({
  id: 'goNoGoMachine',
  context: ({ input }) => input,
  initial: 'bdDraft',
  states: {
    bdDraft: {
      on: {
        SUBMIT_FOR_REVIEW: {
          target: 'awaitingDirectorReview',
          guard: 'canSubmit',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.awaitingDirectorReview } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.awaitingDirectorReview } },
          ],
        },
      },
    },
    awaitingDirectorReview: {
      on: {
        DIRECTOR_APPROVE: {
          target: 'awaitingCommitteeScoring',
          guard: 'canReview',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.awaitingCommitteeScoring } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.awaitingCommitteeScoring } },
          ],
        },
        DIRECTOR_RETURN: {
          target: 'directorReturnedForRevision',
          guard: 'canReview',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.directorReturnedForRevision } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.directorReturnedForRevision } },
          ],
        },
      },
    },
    directorReturnedForRevision: {
      on: {
        RESUBMIT_AFTER_DIRECTOR: {
          target: 'awaitingDirectorReview',
          guard: 'canSubmit',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.awaitingDirectorReview } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.awaitingDirectorReview } },
          ],
        },
      },
    },
    awaitingCommitteeScoring: {
      on: {
        COMMITTEE_APPROVE: {
          target: 'go',
          guard: 'canDecide',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.go } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.go } },
          ],
        },
        COMMITTEE_RETURN: {
          target: 'committeeReturnedForRevision',
          guard: 'canScore',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.committeeReturnedForRevision } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.committeeReturnedForRevision } },
          ],
        },
        COMMITTEE_REJECT: {
          target: 'rejected',
          guard: 'canDecide',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.rejected } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.rejected } },
          ],
        },
        DECIDE_NOGO: {
          target: 'noGo',
          guard: 'canDecide',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.noGo } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.noGo } },
          ],
        },
      },
    },
    committeeReturnedForRevision: {
      on: {
        RESUBMIT_AFTER_COMMITTEE: {
          target: 'awaitingCommitteeScoring',
          guard: 'canSubmit',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.awaitingCommitteeScoring } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.awaitingCommitteeScoring } },
          ],
        },
      },
    },
    go: {
      on: {
        LOCK: {
          target: 'locked',
          guard: 'canLock',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.locked } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.locked } },
          ],
        },
      },
    },
    locked: {
      on: {
        UNLOCK: {
          target: 'unlocked',
          guard: 'canLock',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.unlocked } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.unlocked } },
          ],
        },
      },
    },
    unlocked: {
      on: {
        RELOCK: {
          target: 'locked',
          guard: 'canLock',
          actions: [
            { type: 'auditTransition', params: { to: goNoGoStatusByState.locked } },
            { type: 'setCurrentStatus', params: { to: goNoGoStatusByState.locked } },
          ],
        },
      },
    },
    noGo: { type: 'final' },
    rejected: { type: 'final' },
  },
});

export function mapGoNoGoStateToStatus(state: string): ScorecardStatus {
  return goNoGoStatusByState[(state as GoNoGoStateValue) ?? 'bdDraft'] ?? ScorecardStatus.BDDraft;
}
