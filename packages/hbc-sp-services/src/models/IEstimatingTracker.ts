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
  // TODO (Stage 19+): Auto-takeoff summary calculations and workflow handoff to Ops/PMP pages | Audit: effectiveness (no re-keying) | Impact: High
  // TODO (Stage 19+): Add IProjectHandoffPayload interface for status, financial roll-up, team assignment sync to Operations | Audit: data consistency on award | Impact: High
  FeePaidToDate?: number;
  DesignBudget?: number;
  EstimateType?: DeliverableType;
  EstimatedCostValue?: number;
  CostPerGSF?: number;
  CostPerUnit?: number;
  SubmittedDate?: string;
  AwardStatus?: AwardStatus;
  NotesFeedback?: string;
  /** Stage 18 Sub-task 6b: meeting review mode fields */
  MeetingNotes?: Array<{ timestamp: string; user: string; text: string }>;
  ActionItems?: string;
  MeetingReviewed?: boolean;
}
// TODO (Stage 19+): Extend with deep bid fields (takeoffs, assemblies, ProEst/Bluebeam integration points) | Audit: effectiveness (deep estimating) | Impact: High
