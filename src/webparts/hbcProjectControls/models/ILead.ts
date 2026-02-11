import { Stage, Region, Sector, Division, DepartmentOfOrigin, DeliveryMethod, GoNoGoDecision, WinLossDecision, LossReason } from './enums';

export interface ILead {
  id: number;
  Title: string;
  ClientName: string;
  AE?: string;
  CityLocation?: string;
  AddressStreet?: string;
  AddressCity?: string;
  AddressState?: string;
  AddressZip?: string;
  DateSubmitted?: string;
  Region: Region;
  Sector: Sector;
  SubSector?: string;
  Division: Division;
  Originator: string;
  OriginatorId?: number;
  DepartmentOfOrigin: DepartmentOfOrigin;
  DateOfEvaluation: string;
  PreconDurationMonths?: number;
  SquareFeet?: number;
  ProjectStartDate?: string;
  ProjectDurationMonths?: string;
  EstimatedPursuitCost?: number;
  EstimatedPreconBudget?: number;
  ProjectValue?: number;
  DeliveryMethod?: DeliveryMethod;
  AnticipatedFeePct?: number;
  AnticipatedGrossMargin?: number;
  ProposalBidDue?: string;
  AwardDate?: string;
  Stage: Stage;
  ProjectCode?: string;
  ProjectSiteURL?: string;
  GoNoGoScore_Originator?: number;
  GoNoGoScore_Committee?: number;
  GoNoGoDecision?: GoNoGoDecision;
  GoNoGoDecisionDate?: string;
  WinLossDecision?: WinLossDecision;
  WinLossDate?: string;
  LossReason?: LossReason[];
  LossCompetitor?: string;
  LossAutopsyNotes?: string;
  ProjectExecutive?: string;
  ProjectManager?: string;
  OfficialJobNumber?: string;
  JobNumberRequestId?: number;
}

export interface ILeadFormData extends Omit<ILead, 'id' | 'DateOfEvaluation' | 'Originator' | 'OriginatorId'> {
  id?: number;
}
