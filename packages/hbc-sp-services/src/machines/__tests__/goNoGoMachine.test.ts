import { createActor } from 'xstate';
import { goNoGoMachine, mapGoNoGoStateToStatus, ALL_WORKFLOW_ROLES } from '../goNoGoMachine';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../utils/permissions';
import { RoleName, ScorecardStatus } from '../../models/enums';

describe('goNoGoMachine', () => {
  const baseContext = {
    scorecardId: 100,
    projectCode: 'P-100',
    currentStatus: ScorecardStatus.BDDraft,
    actorRole: RoleName.BDRepresentative,
    userPermissions: [PERMISSIONS.GONOGO_SUBMIT],
  };

  it('covers all 14 workflow roles', () => {
    expect(ALL_WORKFLOW_ROLES).toHaveLength(14);
  });

  it('starts in bdDraft', () => {
    const actor = createActor(goNoGoMachine, { input: baseContext });
    actor.start();
    expect(actor.getSnapshot().value).toBe('bdDraft');
  });

  it('transitions submit -> awaitingDirectorReview', () => {
    const actor = createActor(goNoGoMachine, { input: baseContext });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.BDRepresentative });
    expect(actor.getSnapshot().value).toBe('awaitingDirectorReview');
  });

  it('blocks submit when permission is missing', () => {
    const actor = createActor(goNoGoMachine, {
      input: { ...baseContext, userPermissions: [], actorRole: RoleName.BDRepresentative },
    });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.BDRepresentative });
    expect(actor.getSnapshot().value).toBe('bdDraft');
  });

  it('allows director approve with review permission', () => {
    const actor = createActor(goNoGoMachine, {
      input: {
        ...baseContext,
        actorRole: RoleName.SharePointAdmin,
        userPermissions: [PERMISSIONS.GONOGO_SUBMIT, PERMISSIONS.GONOGO_REVIEW],
      },
    });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.SharePointAdmin });
    actor.send({ type: 'DIRECTOR_APPROVE', actorRole: RoleName.SharePointAdmin });
    expect(actor.getSnapshot().value).toBe('awaitingCommitteeScoring');
  });

  it('finalizes to noGo', () => {
    const actor = createActor(goNoGoMachine, {
      input: {
        ...baseContext,
        actorRole: RoleName.SharePointAdmin,
        userPermissions: [
          PERMISSIONS.GONOGO_SUBMIT,
          PERMISSIONS.GONOGO_REVIEW,
          PERMISSIONS.GONOGO_SCORE_COMMITTEE,
          PERMISSIONS.GONOGO_DECIDE,
        ],
      },
    });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.SharePointAdmin });
    actor.send({ type: 'DIRECTOR_APPROVE', actorRole: RoleName.SharePointAdmin });
    actor.send({ type: 'DECIDE_NOGO', actorRole: RoleName.SharePointAdmin, reason: 'risk' });
    expect(actor.getSnapshot().value).toBe('noGo');
    expect(actor.getSnapshot().status).toBe('done');
  });

  it('maps machine state to ScorecardStatus', () => {
    expect(mapGoNoGoStateToStatus('awaitingCommitteeScoring')).toBe(ScorecardStatus.AwaitingCommitteeScoring);
  });

  it('has permissions configured for known roles', () => {
    expect(ROLE_PERMISSIONS['BD Representative']).toContain(PERMISSIONS.GONOGO_SUBMIT);
    expect(ROLE_PERMISSIONS['Executive Leadership']).toContain(PERMISSIONS.GONOGO_DECIDE);
  });
});
