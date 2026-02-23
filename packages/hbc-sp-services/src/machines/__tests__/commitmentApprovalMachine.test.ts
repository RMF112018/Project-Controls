import { createActor } from 'xstate';
import { commitmentApprovalMachine } from '../commitmentApprovalMachine';
import { PERMISSIONS } from '../../utils/permissions';
import { RoleName } from '../../models/enums';

describe('commitmentApprovalMachine', () => {
  const basePerms = [
    PERMISSIONS.CONTRACT_TRACKING_SUBMIT,
    PERMISSIONS.CONTRACT_TRACKING_APPROVE_APM,
    PERMISSIONS.CONTRACT_TRACKING_APPROVE_PM,
    PERMISSIONS.CONTRACT_TRACKING_APPROVE_RISK,
    PERMISSIONS.CONTRACT_TRACKING_APPROVE_PX,
  ];

  const input = {
    entryId: 42,
    projectCode: 'P-042',
    currentStatus: 'NotStarted' as const,
    actorRole: RoleName.OperationsTeam,
    userPermissions: basePerms,
  };

  it('completes approval chain to tracked', () => {
    const actor = createActor(commitmentApprovalMachine, { input });
    actor.start();
    actor.send({ type: 'SUBMIT' });
    actor.send({ type: 'APPROVE_APM' });
    actor.send({ type: 'APPROVE_PM' });
    actor.send({ type: 'APPROVE_RISK' });
    actor.send({ type: 'APPROVE_PX' });
    expect(actor.getSnapshot().value).toBe('tracked');
  });

  it('rejects at PM stage', () => {
    const actor = createActor(commitmentApprovalMachine, { input });
    actor.start();
    actor.send({ type: 'SUBMIT' });
    actor.send({ type: 'APPROVE_APM' });
    actor.send({ type: 'REJECT_PM', reason: 'bad data' });
    expect(actor.getSnapshot().value).toBe('rejected');
  });

  it('blocks transition when permission missing', () => {
    const actor = createActor(commitmentApprovalMachine, {
      input: { ...input, userPermissions: [PERMISSIONS.CONTRACT_TRACKING_SUBMIT] },
    });
    actor.start();
    actor.send({ type: 'SUBMIT' });
    actor.send({ type: 'APPROVE_APM' });
    expect(actor.getSnapshot().value).toBe('pendingAPM');
  });
});
