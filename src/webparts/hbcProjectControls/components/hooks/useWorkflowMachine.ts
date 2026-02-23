import * as React from 'react';
import { createActor, type AnyEventObject, type AnyStateMachine, type SnapshotFrom } from 'xstate';
import { WorkflowMachineFactory, type WorkflowMachineType } from '@hbc/sp-services';

export interface UseWorkflowMachineOptions<TContext extends { userPermissions: string[] }> {
  machineType: WorkflowMachineType;
  input: TContext;
  persistedState?: unknown;
  enabled?: boolean;
}

export interface UseWorkflowMachineResult<TContext> {
  state: string;
  snapshot: unknown;
  context: TContext;
  send: (event: { type: string; [k: string]: unknown }) => void;
  can: (eventType: string) => boolean;
  allowedEvents: string[];
  isFinal: boolean;
  isReady: boolean;
  error: Error | null;
}

const EVENTS_BY_MACHINE: Record<WorkflowMachineType, string[]> = {
  goNoGo: [
    'SUBMIT_FOR_REVIEW',
    'DIRECTOR_APPROVE',
    'DIRECTOR_RETURN',
    'RESUBMIT_AFTER_DIRECTOR',
    'COMMITTEE_APPROVE',
    'COMMITTEE_RETURN',
    'COMMITTEE_REJECT',
    'DECIDE_NOGO',
    'RESUBMIT_AFTER_COMMITTEE',
    'LOCK',
    'UNLOCK',
    'RELOCK',
  ],
  pmpApproval: [
    'SUBMIT_FOR_APPROVAL',
    'APPROVE_STEP',
    'APPROVE_FINAL',
    'RETURN_STEP',
    'RESUBMIT',
    'BEGIN_SIGNATURES',
    'SIGN',
    'SIGN_FINAL',
  ],
  commitmentApproval: [
    'SUBMIT',
    'APPROVE_APM',
    'REJECT_APM',
    'APPROVE_PM',
    'REJECT_PM',
    'APPROVE_RISK',
    'REJECT_RISK',
    'APPROVE_PX',
    'REJECT_PX',
  ],
};

export function useWorkflowMachine<TContext extends { userPermissions: string[] }>(
  options: UseWorkflowMachineOptions<TContext>
): UseWorkflowMachineResult<TContext> {
  const { machineType, input, persistedState, enabled = true } = options;
  const [actor, setActor] = React.useState<ReturnType<typeof createActor<AnyStateMachine>> | null>(null);
  const [snapshot, setSnapshot] = React.useState<SnapshotFrom<AnyStateMachine> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let activeActor: ReturnType<typeof createActor<AnyStateMachine>> | null = null;

    if (!enabled) {
      setActor(null);
      setSnapshot(null);
      setError(null);
      return () => undefined;
    }

    WorkflowMachineFactory.getAsync(machineType)
      .then((machine) => {
        if (!mounted) return;
        activeActor = createActor(machine, {
          input,
          snapshot: persistedState as never,
        });
        activeActor.start();
        setActor(activeActor);
        setSnapshot(activeActor.getSnapshot());

        const subscription = activeActor.subscribe((nextSnapshot) => {
          setSnapshot(nextSnapshot);
        });

        return () => {
          subscription.unsubscribe();
        };
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      mounted = false;
      activeActor?.stop();
    };
  }, [machineType, input, persistedState, enabled]);

  const send = React.useCallback((event: { type: string; [k: string]: unknown }) => {
    if (!actor) return;
    actor.send(event as AnyEventObject);
    // Sync snapshot immediately — xstate v5 processes events synchronously
    // but defers subscription notifications to a microtask. Reading getSnapshot()
    // here avoids depending on microtask timing for React state updates.
    setSnapshot(actor.getSnapshot());
  }, [actor]);

  const can = React.useCallback((eventType: string): boolean => {
    if (!snapshot) return false;
    try {
      return snapshot.can({ type: eventType });
    } catch {
      return false;
    }
  }, [snapshot]);

  const allowedEvents = React.useMemo(() => {
    if (!enabled || !snapshot) return [];
    return EVENTS_BY_MACHINE[machineType].filter((eventType) => can(eventType));
  }, [enabled, snapshot, machineType, can]);

  const stateValue = React.useMemo(() => {
    if (!snapshot) return '';
    return String(snapshot.value);
  }, [snapshot]);

  return {
    state: stateValue,
    snapshot,
    context: input,
    send,
    can,
    allowedEvents,
    isFinal: snapshot ? snapshot.status === 'done' : false,
    isReady: enabled && !!snapshot,
    error,
  };
}
