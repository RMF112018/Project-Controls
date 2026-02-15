import {
  getValidTransitions,
  canTransition,
  getPrerequisites,
  getStageLabel,
  isActiveStage,
  isArchived,
  validateTransition,
  getStageScreens,
} from '../stageEngine';
import { Stage } from '../../models/enums';

describe('stageEngine', () => {
  describe('getValidTransitions', () => {
    it('LeadDiscovery → [GoNoGoPending, ArchivedHistorical]', () => {
      const transitions = getValidTransitions(Stage.LeadDiscovery);
      expect(transitions).toContain(Stage.GoNoGoPending);
      expect(transitions).toContain(Stage.ArchivedHistorical);
      expect(transitions).toHaveLength(2);
    });

    it('GoNoGoPending → [GoNoGoWait, Opportunity, ArchivedNoGo]', () => {
      const transitions = getValidTransitions(Stage.GoNoGoPending);
      expect(transitions).toContain(Stage.GoNoGoWait);
      expect(transitions).toContain(Stage.Opportunity);
      expect(transitions).toContain(Stage.ArchivedNoGo);
      expect(transitions).toHaveLength(3);
    });

    it('Opportunity → [Pursuit, ArchivedLoss]', () => {
      const transitions = getValidTransitions(Stage.Opportunity);
      expect(transitions).toContain(Stage.Pursuit);
      expect(transitions).toContain(Stage.ArchivedLoss);
      expect(transitions).toHaveLength(2);
    });

    it('Pursuit → [WonContractPending, ArchivedLoss]', () => {
      const transitions = getValidTransitions(Stage.Pursuit);
      expect(transitions).toContain(Stage.WonContractPending);
      expect(transitions).toContain(Stage.ArchivedLoss);
    });

    it('WonContractPending → [ActiveConstruction]', () => {
      const transitions = getValidTransitions(Stage.WonContractPending);
      expect(transitions).toEqual([Stage.ActiveConstruction]);
    });

    it('ActiveConstruction → [Closeout]', () => {
      const transitions = getValidTransitions(Stage.ActiveConstruction);
      expect(transitions).toEqual([Stage.Closeout]);
    });

    it('Closeout → [ArchivedHistorical]', () => {
      const transitions = getValidTransitions(Stage.Closeout);
      expect(transitions).toEqual([Stage.ArchivedHistorical]);
    });

    it('ArchivedNoGo → [] (terminal)', () => {
      expect(getValidTransitions(Stage.ArchivedNoGo)).toEqual([]);
    });

    it('ArchivedLoss → [] (terminal)', () => {
      expect(getValidTransitions(Stage.ArchivedLoss)).toEqual([]);
    });

    it('ArchivedHistorical → [] (terminal)', () => {
      expect(getValidTransitions(Stage.ArchivedHistorical)).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('valid transition returns true', () => {
      expect(canTransition(Stage.LeadDiscovery, Stage.GoNoGoPending)).toBe(true);
      expect(canTransition(Stage.Pursuit, Stage.WonContractPending)).toBe(true);
    });

    it('invalid transition returns false', () => {
      expect(canTransition(Stage.LeadDiscovery, Stage.ActiveConstruction)).toBe(false);
      expect(canTransition(Stage.Closeout, Stage.LeadDiscovery)).toBe(false);
    });

    it('self-transition returns false', () => {
      expect(canTransition(Stage.LeadDiscovery, Stage.LeadDiscovery)).toBe(false);
      expect(canTransition(Stage.Pursuit, Stage.Pursuit)).toBe(false);
    });

    it('terminal stage cannot transition', () => {
      expect(canTransition(Stage.ArchivedNoGo, Stage.LeadDiscovery)).toBe(false);
    });
  });

  describe('getPrerequisites', () => {
    it('returns prerequisites for valid transition', () => {
      const prereqs = getPrerequisites(Stage.LeadDiscovery, Stage.GoNoGoPending);
      expect(prereqs.length).toBeGreaterThan(0);
      expect(prereqs[0]).toContain('Lead must have required fields populated');
    });

    it('returns empty array for invalid transition', () => {
      expect(getPrerequisites(Stage.LeadDiscovery, Stage.ActiveConstruction)).toEqual([]);
    });

    it('returns empty array for terminal stage', () => {
      expect(getPrerequisites(Stage.ArchivedNoGo, Stage.LeadDiscovery)).toEqual([]);
    });
  });

  describe('getStageLabel', () => {
    it('returns human-readable label for each stage', () => {
      expect(getStageLabel(Stage.LeadDiscovery)).toBe('Lead / Discovery');
      expect(getStageLabel(Stage.GoNoGoPending)).toBe('Go/No-Go Pending');
      expect(getStageLabel(Stage.Opportunity)).toBe('Opportunity');
      expect(getStageLabel(Stage.Pursuit)).toBe('Pursuit');
      expect(getStageLabel(Stage.ActiveConstruction)).toBe('Active Construction');
      expect(getStageLabel(Stage.Closeout)).toBe('Closeout');
      expect(getStageLabel(Stage.ArchivedNoGo)).toBe('Archived (No-Go)');
      expect(getStageLabel(Stage.ArchivedLoss)).toBe('Archived (Loss)');
      expect(getStageLabel(Stage.ArchivedHistorical)).toBe('Archived (Historical)');
    });
  });

  describe('isActiveStage', () => {
    it('active stages return true', () => {
      expect(isActiveStage(Stage.LeadDiscovery)).toBe(true);
      expect(isActiveStage(Stage.GoNoGoPending)).toBe(true);
      expect(isActiveStage(Stage.Opportunity)).toBe(true);
      expect(isActiveStage(Stage.Pursuit)).toBe(true);
      expect(isActiveStage(Stage.WonContractPending)).toBe(true);
      expect(isActiveStage(Stage.ActiveConstruction)).toBe(true);
      expect(isActiveStage(Stage.Closeout)).toBe(true);
    });

    it('archived stages return false', () => {
      expect(isActiveStage(Stage.ArchivedNoGo)).toBe(false);
      expect(isActiveStage(Stage.ArchivedLoss)).toBe(false);
      expect(isActiveStage(Stage.ArchivedHistorical)).toBe(false);
    });
  });

  describe('isArchived', () => {
    it('archived stages return true', () => {
      expect(isArchived(Stage.ArchivedNoGo)).toBe(true);
      expect(isArchived(Stage.ArchivedLoss)).toBe(true);
      expect(isArchived(Stage.ArchivedHistorical)).toBe(true);
    });

    it('active stages return false', () => {
      expect(isArchived(Stage.LeadDiscovery)).toBe(false);
      expect(isArchived(Stage.ActiveConstruction)).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('valid transition returns null', () => {
      expect(validateTransition(Stage.LeadDiscovery, Stage.GoNoGoPending)).toBeNull();
    });

    it('invalid transition returns error message', () => {
      const result = validateTransition(Stage.LeadDiscovery, Stage.ActiveConstruction);
      expect(result).toBeTruthy();
      expect(result).toContain('Cannot transition');
    });

    it('terminal stage returns error message', () => {
      const result = validateTransition(Stage.ArchivedNoGo, Stage.LeadDiscovery);
      expect(result).toBeTruthy();
      expect(result).toContain('terminal stage');
    });

    it('admin override to ArchivedNoGo always returns null', () => {
      // Even from a stage that normally can't go to ArchivedNoGo
      expect(validateTransition(Stage.LeadDiscovery, Stage.ArchivedNoGo, true)).toBeNull();
      expect(validateTransition(Stage.ActiveConstruction, Stage.ArchivedNoGo, true)).toBeNull();
    });

    it('admin override to non-ArchivedNoGo still validates', () => {
      const result = validateTransition(Stage.LeadDiscovery, Stage.ActiveConstruction, true);
      expect(result).toBeTruthy();
    });
  });

  describe('getStageScreens', () => {
    it('Opportunity includes kickoff, deliverables, interview', () => {
      const screens = getStageScreens(Stage.Opportunity);
      expect(screens).toEqual(['kickoff', 'deliverables', 'interview']);
    });

    it('Pursuit includes winloss', () => {
      const screens = getStageScreens(Stage.Pursuit);
      expect(screens).toContain('winloss');
    });

    it('ActiveConstruction has many screens', () => {
      const screens = getStageScreens(Stage.ActiveConstruction);
      expect(screens).toContain('deliverables');
      expect(screens).toContain('buyout');
      expect(screens).toContain('pmp');
      expect(screens).toContain('monthly-review');
      expect(screens.length).toBe(13);
    });

    it('ArchivedLoss includes autopsy', () => {
      expect(getStageScreens(Stage.ArchivedLoss)).toEqual(['autopsy']);
    });

    it('LeadDiscovery returns empty', () => {
      expect(getStageScreens(Stage.LeadDiscovery)).toEqual([]);
    });

    it('ArchivedNoGo returns empty', () => {
      expect(getStageScreens(Stage.ArchivedNoGo)).toEqual([]);
    });
  });
});
