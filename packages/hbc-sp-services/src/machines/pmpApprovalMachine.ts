import { assign, setup } from 'xstate';
import { PERMISSIONS } from '../utils/permissions';
import type { IPmpApprovalMachineContext } from './types';

export type PmpApprovalStateValue =
  | 'draft'
  | 'pendingApproval'
  | 'returned'
  | 'approved'
  | 'pendingSignatures'
  | 'closed';

export type PmpApprovalEvent =
  | { type: 'SUBMIT_FOR_APPROVAL' }
  | { type: 'APPROVE_STEP' }
  | { type: 'APPROVE_FINAL' }
  | { type: 'RETURN_STEP'; reason?: string }
  | { type: 'RESUBMIT' }
  | { type: 'BEGIN_SIGNATURES' }
  | { type: 'SIGN' }
  | { type: 'SIGN_FINAL' };

export const pmpApprovalMachine = setup({
  types: {
    context: {} as IPmpApprovalMachineContext,
    events: {} as PmpApprovalEvent,
    input: {} as IPmpApprovalMachineContext,
  },
  guards: {
    canEdit: ({ context }) => context.userPermissions.includes(PERMISSIONS.PMP_EDIT),
    canApprove: ({ context }) => context.userPermissions.includes(PERMISSIONS.PMP_APPROVE),
    canFinalApprove: ({ context }) => context.userPermissions.includes(PERMISSIONS.PMP_FINAL_APPROVE),
    canSign: ({ context }) => context.userPermissions.includes(PERMISSIONS.PMP_SIGN),
    hasMoreApprovalSteps: ({ context }) => context.pendingSteps > 1,
    hasOneApprovalStep: ({ context }) => context.pendingSteps <= 1,
    hasMoreSignatures: ({ context }) => context.pendingSignatures > 1,
    hasOneSignature: ({ context }) => context.pendingSignatures <= 1,
    canApproveStep: ({ context }) =>
      context.userPermissions.includes(PERMISSIONS.PMP_APPROVE) && context.pendingSteps > 1,
    canApproveFinal: ({ context }) =>
      context.userPermissions.includes(PERMISSIONS.PMP_FINAL_APPROVE) && context.pendingSteps <= 1,
    canSignStep: ({ context }) =>
      context.userPermissions.includes(PERMISSIONS.PMP_SIGN) && context.pendingSignatures > 1,
    canSignFinal: ({ context }) =>
      context.userPermissions.includes(PERMISSIONS.PMP_SIGN) && context.pendingSignatures <= 1,
  },
  actions: {
    decrementPendingSteps: assign({
      pendingSteps: ({ context }) => Math.max(0, context.pendingSteps - 1),
    }),
    decrementPendingSignatures: assign({
      pendingSignatures: ({ context }) => Math.max(0, context.pendingSignatures - 1),
    }),
  },
}).createMachine({
  id: 'pmpApprovalMachine',
  context: ({ input }) => input,
  initial: 'draft',
  states: {
    draft: {
      on: {
        SUBMIT_FOR_APPROVAL: { target: 'pendingApproval', guard: 'canEdit' },
      },
    },
    pendingApproval: {
      on: {
        APPROVE_STEP: {
          target: 'pendingApproval',
          guard: 'canApproveStep',
          actions: 'decrementPendingSteps',
        },
        APPROVE_FINAL: {
          target: 'approved',
          guard: 'canApproveFinal',
        },
        RETURN_STEP: {
          target: 'returned',
          guard: 'canApprove',
        },
      },
    },
    returned: {
      on: {
        RESUBMIT: { target: 'pendingApproval', guard: 'canEdit' },
      },
    },
    approved: {
      on: {
        BEGIN_SIGNATURES: { target: 'pendingSignatures', guard: 'canFinalApprove' },
      },
    },
    pendingSignatures: {
      on: {
        SIGN: {
          target: 'pendingSignatures',
          guard: 'canSignStep',
          actions: 'decrementPendingSignatures',
        },
        SIGN_FINAL: {
          target: 'closed',
          guard: 'canSignFinal',
        },
      },
    },
    closed: { type: 'final' },
  },
});
