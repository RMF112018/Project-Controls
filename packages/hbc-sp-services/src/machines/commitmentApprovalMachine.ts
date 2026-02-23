import { setup } from 'xstate';
import { PERMISSIONS } from '../utils/permissions';
import type { ICommitmentApprovalMachineContext } from './types';

export type CommitmentApprovalStateValue =
  | 'notStarted'
  | 'pendingAPM'
  | 'pendingPM'
  | 'pendingRiskMgr'
  | 'pendingPX'
  | 'tracked'
  | 'rejected';

export type CommitmentApprovalEvent =
  | { type: 'SUBMIT' }
  | { type: 'APPROVE_APM' }
  | { type: 'REJECT_APM'; reason?: string }
  | { type: 'APPROVE_PM' }
  | { type: 'REJECT_PM'; reason?: string }
  | { type: 'APPROVE_RISK' }
  | { type: 'REJECT_RISK'; reason?: string }
  | { type: 'APPROVE_PX' }
  | { type: 'REJECT_PX'; reason?: string };

export const commitmentApprovalMachine = setup({
  types: {
    context: {} as ICommitmentApprovalMachineContext,
    events: {} as CommitmentApprovalEvent,
    input: {} as ICommitmentApprovalMachineContext,
  },
  guards: {
    canSubmit: ({ context }) => context.userPermissions.includes(PERMISSIONS.CONTRACT_TRACKING_SUBMIT),
    canApproveAPM: ({ context }) => context.userPermissions.includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_APM),
    canApprovePM: ({ context }) => context.userPermissions.includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PM),
    canApproveRisk: ({ context }) => context.userPermissions.includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_RISK),
    canApprovePX: ({ context }) => context.userPermissions.includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PX),
  },
}).createMachine({
  id: 'commitmentApprovalMachine',
  context: ({ input }) => input,
  initial: 'notStarted',
  states: {
    notStarted: {
      on: {
        SUBMIT: { target: 'pendingAPM', guard: 'canSubmit' },
      },
    },
    pendingAPM: {
      on: {
        APPROVE_APM: { target: 'pendingPM', guard: 'canApproveAPM' },
        REJECT_APM: { target: 'rejected', guard: 'canApproveAPM' },
      },
    },
    pendingPM: {
      on: {
        APPROVE_PM: { target: 'pendingRiskMgr', guard: 'canApprovePM' },
        REJECT_PM: { target: 'rejected', guard: 'canApprovePM' },
      },
    },
    pendingRiskMgr: {
      on: {
        APPROVE_RISK: { target: 'pendingPX', guard: 'canApproveRisk' },
        REJECT_RISK: { target: 'rejected', guard: 'canApproveRisk' },
      },
    },
    pendingPX: {
      on: {
        APPROVE_PX: { target: 'tracked', guard: 'canApprovePX' },
        REJECT_PX: { target: 'rejected', guard: 'canApprovePX' },
      },
    },
    tracked: { type: 'final' },
    rejected: { type: 'final' },
  },
});
