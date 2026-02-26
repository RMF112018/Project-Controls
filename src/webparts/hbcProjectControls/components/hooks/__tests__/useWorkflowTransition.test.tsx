import { renderHook } from '@testing-library/react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { UseWorkflowMachineResult } from '../useWorkflowMachine';
import { useWorkflowTransition } from '../useWorkflowTransition';

type WorkflowCtx = { userPermissions: string[] };
type TransitionVars = { eventType: string };

describe('useWorkflowTransition', () => {
  it('rejects when transition is not allowed', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    const workflow: Pick<UseWorkflowMachineResult<WorkflowCtx>, 'state' | 'can' | 'send'> = {
      state: 'bdDraft',
      can: () => false,
      send: jest.fn(),
    };

    const mutation: Pick<UseMutationResult<unknown, Error, TransitionVars>, 'mutateAsync' | 'isPending'> = {
      mutateAsync,
      isPending: false,
    };

    const { result } = renderHook(() =>
      useWorkflowTransition({
        workflow: workflow as UseWorkflowMachineResult<WorkflowCtx>,
        mutation: mutation as UseMutationResult<unknown, Error, TransitionVars>,
      })
    );

    await expect(result.current.transition('DIRECTOR_APPROVE', { eventType: 'DIRECTOR_APPROVE' })).rejects.toThrow(
      "Transition 'DIRECTOR_APPROVE' is not allowed"
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('mutates then sends event on success', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ ok: true });
    const send = jest.fn();
    const workflow: Pick<UseWorkflowMachineResult<WorkflowCtx>, 'state' | 'can' | 'send'> = {
      state: 'bdDraft',
      can: () => true,
      send,
    };

    const mutation: Pick<UseMutationResult<unknown, Error, TransitionVars>, 'mutateAsync' | 'isPending'> = {
      mutateAsync,
      isPending: false,
    };

    const { result } = renderHook(() =>
      useWorkflowTransition({
        workflow: workflow as UseWorkflowMachineResult<WorkflowCtx>,
        mutation: mutation as UseMutationResult<unknown, Error, TransitionVars>,
      })
    );

    await result.current.transition('SUBMIT_FOR_REVIEW', { eventType: 'SUBMIT_FOR_REVIEW' }, { actorRole: 'BD Representative' });

    expect(mutateAsync).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({ type: 'SUBMIT_FOR_REVIEW', actorRole: 'BD Representative' });
  });
});
