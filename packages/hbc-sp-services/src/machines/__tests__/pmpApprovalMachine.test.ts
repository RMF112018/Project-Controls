import { createActor } from 'xstate';
import { pmpApprovalMachine } from '../pmpApprovalMachine';
import { PERMISSIONS } from '../../utils/permissions';
import { RoleName } from '../../models/enums';

describe('pmpApprovalMachine', () => {
  const base = {
    pmpId: 1,
    projectCode: 'P-001',
    currentStatus: 'Draft' as const,
    pendingSteps: 2,
    pendingSignatures: 2,
    actorRole: RoleName.CommercialOperationsManager,
    userPermissions: [PERMISSIONS.PMP_EDIT, PERMISSIONS.PMP_APPROVE, PERMISSIONS.PMP_FINAL_APPROVE, PERMISSIONS.PMP_SIGN],
  };

  it('runs draft -> pendingApproval', () => {
    const actor = createActor(pmpApprovalMachine, { input: base });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_APPROVAL' });
    expect(actor.getSnapshot().value).toBe('pendingApproval');
  });

  it('decrements pending steps on APPROVE_STEP', () => {
    const actor = createActor(pmpApprovalMachine, { input: base });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_APPROVAL' });
    actor.send({ type: 'APPROVE_STEP' });
    expect(actor.getSnapshot().value).toBe('pendingApproval');
    expect(actor.getSnapshot().context.pendingSteps).toBe(1);
  });

  it('moves to approved when only one step remains', () => {
    const actor = createActor(pmpApprovalMachine, { input: { ...base, pendingSteps: 1 } });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_APPROVAL' });
    actor.send({ type: 'APPROVE_FINAL' });
    expect(actor.getSnapshot().value).toBe('approved');
  });

  it('moves through signatures to closed', () => {
    const actor = createActor(pmpApprovalMachine, { input: { ...base, pendingSteps: 1, pendingSignatures: 1 } });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_APPROVAL' });
    actor.send({ type: 'APPROVE_FINAL' });
    actor.send({ type: 'BEGIN_SIGNATURES' });
    actor.send({ type: 'SIGN_FINAL' });
    expect(actor.getSnapshot().value).toBe('closed');
    expect(actor.getSnapshot().status).toBe('done');
  });
});
