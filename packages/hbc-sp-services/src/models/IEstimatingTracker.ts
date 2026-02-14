import { AwardStatus, EstimateSource, DeliverableType } from './enums';

export interface IEstimatingTracker {
  id: number;
  /** @denormalized — source: Leads_Master.Title */
  Title: string;
  LeadID: number;
  ProjectCode: string;
  Source?: EstimateSource;
  DeliverableType?: DeliverableType;
  SubBidsDue?: string;
  PreSubmissionReview?: string;
  WinStrategyMeeting?: string;
  DueDate_OutTheDoor?: string;
  LeadEstimator?: string;
  LeadEstimatorId?: number;
  Contributors?: string[];
  ContributorIds?: number[];
  PX_ProjectExecutive?: string;
  PX_ProjectExecutiveId?: number;
  Chk_BidBond?: boolean;
  Chk_PPBond?: boolean;
  Chk_Schedule?: boolean;
  Chk_Logistics?: boolean;
  Chk_BIMProposal?: boolean;
  Chk_PreconProposal?: boolean;
  Chk_ProposalTabs?: boolean;
  Chk_CoordMarketing?: boolean;
  Chk_BusinessTerms?: boolean;
  DocSetStage?: string;
  PreconFee?: number;
  FeePaidToDate?: number;
  DesignBudget?: number;
  EstimateType?: DeliverableType;
  EstimatedCostValue?: number;
  CostPerGSF?: number;
  CostPerUnit?: number;
  SubmittedDate?: string;
  AwardStatus?: AwardStatus;
  NotesFeedback?: string;
}
