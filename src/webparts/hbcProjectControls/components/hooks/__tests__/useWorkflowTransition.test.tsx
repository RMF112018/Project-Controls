import { renderHook } from '@testing-library/react';
import { useWorkflowTransition } from '../useWorkflowTransition';

describe('useWorkflowTransition', () => {
  it('rejects when transition is not allowed', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    const workflow = {
      state: 'bdDraft',
      can: () => false,
      send: jest.fn(),
    } as any;

    const { result } = renderHook(() =>
      useWorkflowTransition({
        workflow,
        mutation: { mutateAsync, isPending: false } as any,
      })
    );

    await expect(result.current.transition('DIRECTOR_APPROVE', { eventType: 'DIRECTOR_APPROVE' } as any)).rejects.toThrow(
      "Transition 'DIRECTOR_APPROVE' is not allowed"
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('mutates then sends event on success', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ ok: true });
    const send = jest.fn();
    const workflow = {
      state: 'bdDraft',
      can: () => true,
      send,
    } as any;

    const { result } = renderHook(() =>
      useWorkflowTransition({
        workflow,
        mutation: { mutateAsync, isPending: false } as any,
      })
    );

    await result.current.transition('SUBMIT_FOR_REVIEW', { eventType: 'SUBMIT_FOR_REVIEW' } as any, { actorRole: 'BD Representative' });

    expect(mutateAsync).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({ type: 'SUBMIT_FOR_REVIEW', actorRole: 'BD Representative' });
  });
});
