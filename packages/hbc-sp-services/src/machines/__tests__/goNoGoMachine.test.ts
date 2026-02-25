import { createActor } from 'xstate';
import { goNoGoMachine, mapGoNoGoStateToStatus, ALL_WORKFLOW_ROLES } from '../goNoGoMachine';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../utils/permissions';
import { RoleName, ScorecardStatus } from '../../models/enums';

describe('goNoGoMachine', () => {
  const baseContext = {
    scorecardId: 100,
    projectCode: 'P-100',
    currentStatus: ScorecardStatus.BDDraft,
    actorRole: RoleName.BusinessDevelopmentManager,
    userPermissions: [PERMISSIONS.GONOGO_SUBMIT],
  };

  it('covers all 16 workflow roles', () => {
    expect(ALL_WORKFLOW_ROLES).toHaveLength(16);
  });

  it('starts in bdDraft', () => {
    const actor = createActor(goNoGoMachine, { input: baseContext });
    actor.start();
    expect(actor.getSnapshot().value).toBe('bdDraft');
  });

  it('transitions submit -> awaitingDirectorReview', () => {
    const actor = createActor(goNoGoMachine, { input: baseContext });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.BusinessDevelopmentManager });
    expect(actor.getSnapshot().value).toBe('awaitingDirectorReview');
  });

  it('blocks submit when permission is missing', () => {
    const actor = createActor(goNoGoMachine, {
      input: { ...baseContext, userPermissions: [], actorRole: RoleName.BusinessDevelopmentManager },
    });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.BusinessDevelopmentManager });
    expect(actor.getSnapshot().value).toBe('bdDraft');
  });

  it('allows director approve with review permission', () => {
    const actor = createActor(goNoGoMachine, {
      input: {
        ...baseContext,
        actorRole: RoleName.Administrator,
        userPermissions: [PERMISSIONS.GONOGO_SUBMIT, PERMISSIONS.GONOGO_REVIEW],
      },
    });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.Administrator });
    actor.send({ type: 'DIRECTOR_APPROVE', actorRole: RoleName.Administrator });
    expect(actor.getSnapshot().value).toBe('awaitingCommitteeScoring');
  });

  it('finalizes to noGo', () => {
    const actor = createActor(goNoGoMachine, {
      input: {
        ...baseContext,
        actorRole: RoleName.Administrator,
        userPermissions: [
          PERMISSIONS.GONOGO_SUBMIT,
          PERMISSIONS.GONOGO_REVIEW,
          PERMISSIONS.GONOGO_SCORE_COMMITTEE,
          PERMISSIONS.GONOGO_DECIDE,
        ],
      },
    });
    actor.start();
    actor.send({ type: 'SUBMIT_FOR_REVIEW', actorRole: RoleName.Administrator });
    actor.send({ type: 'DIRECTOR_APPROVE', actorRole: RoleName.Administrator });
    actor.send({ type: 'DECIDE_NOGO', actorRole: RoleName.Administrator, reason: 'risk' });
    expect(actor.getSnapshot().value).toBe('noGo');
    expect(actor.getSnapshot().status).toBe('done');
  });

  it('maps machine state to ScorecardStatus', () => {
    expect(mapGoNoGoStateToStatus('awaitingCommitteeScoring')).toBe(ScorecardStatus.AwaitingCommitteeScoring);
  });

  // Stage 3: Updated to reflect granular per-role permissions.
  it('has permissions configured for known roles', () => {
    expect(ROLE_PERMISSIONS['Business Development Manager']).toContain(PERMISSIONS.GONOGO_SUBMIT);
    expect(ROLE_PERMISSIONS['Preconstruction Manager']).toContain(PERMISSIONS.GONOGO_DECIDE);
    expect(ROLE_PERMISSIONS['Leadership']).toContain(PERMISSIONS.GONOGO_READ);
  });
});
