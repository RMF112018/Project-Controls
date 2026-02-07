import { Stage } from '../models/enums';

interface IStageTransition {
  from: Stage;
  to: Stage[];
  prerequisites?: string[];
}

const STAGE_TRANSITIONS: IStageTransition[] = [
  {
    from: Stage.LeadDiscovery,
    to: [Stage.GoNoGoPending, Stage.ArchivedHistorical],
    prerequisites: ['Lead must have required fields populated'],
  },
  {
    from: Stage.GoNoGoPending,
    to: [Stage.GoNoGoWait, Stage.Opportunity, Stage.ArchivedNoGo],
    prerequisites: ['Originator scorecard must be completed'],
  },
  {
    from: Stage.GoNoGoWait,
    to: [Stage.GoNoGoPending, Stage.ArchivedNoGo],
  },
  {
    from: Stage.Opportunity,
    to: [Stage.Pursuit, Stage.ArchivedLoss],
    prerequisites: ['Project code must be assigned', 'Site must be provisioned'],
  },
  {
    from: Stage.Pursuit,
    to: [Stage.WonContractPending, Stage.ArchivedLoss],
    prerequisites: ['Proposal must be submitted'],
  },
  {
    from: Stage.WonContractPending,
    to: [Stage.ActiveConstruction],
    prerequisites: ['Contract must be executed'],
  },
  {
    from: Stage.ActiveConstruction,
    to: [Stage.Closeout],
    prerequisites: ['Turnover checklist must be complete'],
  },
  {
    from: Stage.Closeout,
    to: [Stage.ArchivedHistorical],
    prerequisites: ['Closeout checklist must be complete'],
  },
];

export function getValidTransitions(currentStage: Stage): Stage[] {
  const transition = STAGE_TRANSITIONS.find(t => t.from === currentStage);
  return transition ? transition.to : [];
}

export function canTransition(from: Stage, to: Stage): boolean {
  const validTargets = getValidTransitions(from);
  return validTargets.includes(to);
}

export function getPrerequisites(from: Stage, to: Stage): string[] {
  const transition = STAGE_TRANSITIONS.find(t => t.from === from);
  if (!transition || !transition.to.includes(to)) return [];
  return transition.prerequisites || [];
}

export function getStageLabel(stage: Stage): string {
  const labels: Record<Stage, string> = {
    [Stage.LeadDiscovery]: 'Lead / Discovery',
    [Stage.GoNoGoPending]: 'Go/No-Go Pending',
    [Stage.GoNoGoWait]: 'Go/No-Go Wait',
    [Stage.Opportunity]: 'Opportunity',
    [Stage.Pursuit]: 'Pursuit',
    [Stage.WonContractPending]: 'Won - Contract Pending',
    [Stage.ActiveConstruction]: 'Active Construction',
    [Stage.Closeout]: 'Closeout',
    [Stage.ArchivedNoGo]: 'Archived (No-Go)',
    [Stage.ArchivedLoss]: 'Archived (Loss)',
    [Stage.ArchivedHistorical]: 'Archived (Historical)',
  };
  return labels[stage] || stage;
}

export function isActiveStage(stage: Stage): boolean {
  return ![Stage.ArchivedNoGo, Stage.ArchivedLoss, Stage.ArchivedHistorical].includes(stage);
}

export function isArchived(stage: Stage): boolean {
  return [Stage.ArchivedNoGo, Stage.ArchivedLoss, Stage.ArchivedHistorical].includes(stage);
}
