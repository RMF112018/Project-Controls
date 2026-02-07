import { GoNoGoDecision } from './enums';

export interface IScorecardCriterion {
  id: number;
  label: string;
  high: number;
  avg: number;
  low: number;
}

export const SCORECARD_CRITERIA: IScorecardCriterion[] = [
  { id: 1, label: 'Client Importance', high: 6, avg: 4, low: 2 },
  { id: 2, label: 'Competition (short list)', high: 4, avg: 2, low: 0 },
  { id: 3, label: 'Estimated Project $', high: 4, avg: 2, low: 1 },
  { id: 4, label: 'Location/Environment', high: 5, avg: 3, low: 1 },
  { id: 5, label: 'Commercially Viable', high: 6, avg: 4, low: 2 },
  { id: 6, label: 'Preferred by Decision Maker', high: 6, avg: 3, low: 0 },
  { id: 7, label: 'A&E Experience', high: 5, avg: 4, low: 1 },
  { id: 8, label: 'Staff Availability', high: 4, avg: 2, low: 1 },
  { id: 9, label: 'Staff Experience in Project Type', high: 5, avg: 3, low: 0 },
  { id: 10, label: 'Staff Experience in Geography', high: 5, avg: 3, low: 0 },
  { id: 11, label: 'Schedule', high: 3, avg: 2, low: 1 },
  { id: 12, label: 'Contract Terms/Conditions', high: 4, avg: 3, low: 0 },
  { id: 13, label: 'Type of Contract', high: 5, avg: 4, low: 1 },
  { id: 14, label: 'Client Financing', high: 5, avg: 3, low: 1 },
  { id: 15, label: 'Supports Sector Diversification', high: 7, avg: 5, low: 2 },
  { id: 16, label: 'Investment Front End/Time', high: 5, avg: 2, low: 1 },
  { id: 17, label: 'Profit Potential', high: 5, avg: 3, low: 2 },
  { id: 18, label: 'Fee Enhancement', high: 5, avg: 3, low: 2 },
  { id: 19, label: 'Self Perform Potential', high: 3, avg: 2, low: 1 },
];

export interface IGoNoGoScorecard {
  id: number;
  LeadID: number;
  ProjectCode?: string;
  scores: {
    [criterionId: number]: {
      originator?: number;
      committee?: number;
    };
  };
  TotalScore_Orig?: number;
  TotalScore_Cmte?: number;
  OriginatorComments?: string;
  CommitteeComments?: string;
  ProposalMarketingComments?: string;
  ProposalMarketingResources?: string;
  ProposalMarketingHours?: number;
  EstimatingComments?: string;
  EstimatingResources?: string;
  EstimatingHours?: number;
  DecisionMakingProcess?: string;
  HBDifferentiators?: string;
  WinStrategy?: string;
  StrategicPursuit?: string;
  DecisionMakerAdvocate?: string;
  Decision?: GoNoGoDecision;
  DecisionDate?: string;
  ScoredBy_Orig?: string;
  ScoredBy_Cmte?: string[];
}
