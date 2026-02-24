import type { AnyStateMachine } from 'xstate';
import type { WorkflowMachineType } from './types';
import { goNoGoMachine } from './goNoGoMachine';
import { pmpApprovalMachine } from './pmpApprovalMachine';
import { commitmentApprovalMachine } from './commitmentApprovalMachine';

const syncRegistry: Record<WorkflowMachineType, AnyStateMachine> = {
  goNoGo: goNoGoMachine,
  pmpApproval: pmpApprovalMachine,
  commitmentApproval: commitmentApprovalMachine,
};

/**
 * WorkflowMachineFactory — Singleton factory for xstate v5 workflow machines.
 *
 * DUAL-PATH ENFORCEMENT (Phase 5B):
 * - Feature flag `WorkflowStateMachine` gates all machine usage in UI.
 * - When flag OFF: machines are never instantiated; legacy imperative path runs byte-for-byte.
 * - When flag ON: machines loaded lazily via getAsync() into lib-xstate-workflow chunk.
 * - UI components MUST use useWorkflowMachine/useWorkflowTransition hooks — never import
 *   machines directly or call machine.send() outside hooks.
 */
export class WorkflowMachineFactory {
  private static asyncCache = new Map<WorkflowMachineType, Promise<AnyStateMachine>>();

  public static get(type: WorkflowMachineType): AnyStateMachine {
    return syncRegistry[type];
  }

  public static register(type: WorkflowMachineType, machine: AnyStateMachine): void {
    syncRegistry[type] = machine;
    this.asyncCache.delete(type);
  }

  public static getAsync(type: WorkflowMachineType): Promise<AnyStateMachine> {
    if (!this.asyncCache.has(type)) {
      this.asyncCache.set(
        type,
        import(
          /* webpackChunkName: "lib-xstate-workflow" */
          './index'
        ).then((module) => {
          if (type === 'goNoGo') return module.goNoGoMachine;
          if (type === 'pmpApproval') return module.pmpApprovalMachine;
          if (type === 'commitmentApproval') return module.commitmentApprovalMachine;
          throw new Error(`Unsupported workflow machine type: ${type}`);
        })
      );
    }

    return this.asyncCache.get(type)!;
  }
}
