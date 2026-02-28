/**
 * IProjectHandoffPayload
 *
 * Stage 19 Sub-task 1: Payload for the handoffProjectFromEstimating() mutation.
 * Captures all data needed to transition a project from Estimating/Preconstruction
 * to Operations via the Turnover Meeting sign-off flow.
 *
 * SOP Reference: "Estimating and Project Manager Turnover Meeting Procedure"
 * (reference/EstTurnover/Turnover Agenda.docx)
 */

export interface IProjectHandoffPayload {
  projectCode: string;
  turnoverAgendaId: number;
  estimatingTrackerId: number;

  // Financial roll-up from ITurnoverEstimateOverview
  contractAmount: number;
  originalEstimate: number;
  buyoutTarget: number;
  estimatedFee: number;
  estimatedGrossMargin: number;
  contingency: number;

  // Team assignments from ITurnoverProjectHeader
  projectExecutive: string;
  projectManager: string;
  leadEstimator: string;

  // Sign-off records — captured at turnover meeting completion
  signatures: Array<{
    role: string;
    signerName: string;
    signerEmail: string;
    signedDate: string;
  }>;

  // Generated artifacts
  pdfUrl?: string;
  turnoverFolderUrl?: string;

  // Metadata
  handoffDate: string;
  initiatedBy: string;
}

// TODO (Stage 19 – Sub-task 9): Extend IProjectHandoffPayload with deepBidPackage (single primary + raw file link). Update "Mark as Awarded" flow to carry complete normalized package to Project Hub (ties directly to existing handoff TODOs in ProjectHubDashboardPage.tsx). Reference: plan handoff payload update deliverable.

// TODO (Stage 19 – Sub-task 15): Extend `deepBidPackage` with turnoverAgendaPopulation object (primaryCostSummaryMapping, primaryGCGRMapping, rawFileLinkForAudit, attribution). Ensure the handoff carries all fields required to auto-populate Turnover agenda sections without data loss or manual re-entry. Reference new Sub-task 15 added 28 February 2026.
