import { WorkflowMachineFactory } from '../WorkflowMachineFactory';

describe('WorkflowMachineFactory', () => {
  it('gets machine synchronously', () => {
    const machine = WorkflowMachineFactory.get('goNoGo');
    expect(machine.id).toBe('goNoGoMachine');
  });

  it('gets machine asynchronously', async () => {
    const machine = await WorkflowMachineFactory.getAsync('pmpApproval');
    expect(machine.id).toBe('pmpApprovalMachine');
  });

  it('caches async machine lookups', async () => {
    const first = WorkflowMachineFactory.getAsync('commitmentApproval');
    const second = WorkflowMachineFactory.getAsync('commitmentApproval');
    expect(first).toBe(second);
    const resolved = await first;
    expect(resolved.id).toBe('commitmentApprovalMachine');
  });
});
