import { IActionItem } from './IActionItem';

/** Yes/No/NA response for estimating process questions */
export type AutopsyAnswer = boolean | null;

export interface ILossAutopsy {
  id: number;
  leadId: number;
  projectCode?: string;

  // --- Existing Fields ---
  rootCauseAnalysis?: string;
  lessonsLearned?: string;
  competitiveIntelligence?: string;
  actionItems: IActionItem[];
  meetingNotes?: string;
  completedDate?: string;
  completedBy?: string;

  // --- Estimating Process Questions (11 Yes/No/NA) ---
  realisticTimeline: AutopsyAnswer;
  scopesBeforeProposals: AutopsyAnswer;         // 15+ days = Yes
  threeBidsPerTrade: AutopsyAnswer;
  reasonableITBTime: AutopsyAnswer;
  bidsSavedProperly: AutopsyAnswer;
  multipleSubCommunications: AutopsyAnswer;
  vettedProposals: AutopsyAnswer;                // Compass
  reasonableSpread: AutopsyAnswer;               // 5% or less = Yes
  pricesMatchHistorical: AutopsyAnswer;
  veOptionsOffered: AutopsyAnswer;
  deliverablesOnTime: AutopsyAnswer;

  // --- Scoring & Discussion ---
  processScore: number;                          // Calculated % based on Yes answers
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  challenges?: string;
  overallRating: number;                         // 1–10 scale

  // --- Meeting & Status ---
  meetingScheduledDate?: string;
  meetingAttendees: string[];
  isFinalized: boolean;                          // Controls archive lock
  finalizedDate?: string;
  finalizedBy?: string;
}

/** Labels and tooltips for the 11 estimating process questions */
export const AUTOPSY_QUESTIONS: { key: keyof ILossAutopsy; label: string; tooltip: string }[] = [
  { key: 'realisticTimeline', label: 'Realistic Timeline?', tooltip: 'Was the project timeline realistic and achievable?' },
  { key: 'scopesBeforeProposals', label: 'Scopes before proposals?', tooltip: '15+ days before proposals = Yes' },
  { key: 'threeBidsPerTrade', label: '3 bids per major trade?', tooltip: 'Were at least 3 bids obtained for each major trade?' },
  { key: 'reasonableITBTime', label: 'Reasonable ITB time?', tooltip: 'Was the Invitation to Bid time frame reasonable?' },
  { key: 'bidsSavedProperly', label: 'Bids saved/submitted properly?', tooltip: 'Were all bids saved and submitted correctly?' },
  { key: 'multipleSubCommunications', label: 'Multiple sub communications?', tooltip: 'Were multiple communications made with subcontractors?' },
  { key: 'vettedProposals', label: 'Vetted proposals (Compass)?', tooltip: 'Were proposals vetted using Compass or equivalent system?' },
  { key: 'reasonableSpread', label: 'Reasonable spread?', tooltip: '5% or less spread = Yes' },
  { key: 'pricesMatchHistorical', label: 'Prices match historical data?', tooltip: 'If No, automatically triggers a High Priority action item to update historical records.' },
  { key: 'veOptionsOffered', label: 'VE options offered?', tooltip: 'Were Value Engineering options offered to the client?' },
  { key: 'deliverablesOnTime', label: 'Deliverables ready on time?', tooltip: 'Were all deliverables completed and submitted on time?' },
];
