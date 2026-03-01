/**
 * Stage 21 — Post-Bid Autopsy Model
 *
 * 100% field parity with reference/Estimating - Post Bid Autopsy.xlsx
 * Sheet: "Bid Project Analysis _Feedback" (B1:G57)
 *
 * Hybrid design:
 *  - items[] array for 13 estimating process questions (config-driven, supports custom additions)
 *  - 16 flat text fields for SWOC open discussion sections (type-safe, fixed prompts)
 *  - Flat fields for closing, rating, metadata
 */

// ── Types ──────────────────────────────────────────────────────────────

export type PostBidAnswer = 'yes' | 'no' | null;

// ── Process Question Item ──────────────────────────────────────────────

export interface IPostBidAutopsyItem {
  id: number;
  autopsyId: number;
  questionKey: string;
  question: string;
  answer: PostBidAnswer;
  /** Review criteria text (e.g. ">=15 days = Yes; <15 = No") */
  criteria?: string;
  /** Team meeting evaluation notes — maps to Excel column C */
  teamEvaluation?: string;
  /** Weakness/issue description — shown when answer is 'no' — maps to Excel columns F-G */
  weaknessNotes?: string;
  sortOrder: number;
  isCustom?: boolean;
}

// ── Main Autopsy Record ────────────────────────────────────────────────

export interface IPostBidAutopsy {
  id: number;
  ProjectCode: string;
  LeadID?: number;

  /** Date of analysis — maps to Excel row 1 date field */
  AnalysisDate?: string;

  // ── Estimating Process Questions (13 default items) ──────────────
  items: IPostBidAutopsyItem[];

  // ── SWOC: Strengths (3 fields) ───────────────────────────────────
  /** Advantages within the project */
  strengths_advantages?: string;
  /** What assisted best project turnout */
  strengths_bestTurnout?: string;
  /** Plan to share with team */
  strengths_shareWithTeam?: string;

  // ── SWOC: Weaknesses (4 fields) ──────────────────────────────────
  /** Resources lacking */
  weaknesses_resourcesLacking?: string;
  /** Areas to improve (this/future project) */
  weaknesses_areasToImprove?: string;
  /** Most challenging area (team) */
  weaknesses_mostChallenging?: string;
  /** Missed/problematic scope elements */
  weaknesses_missedScopes?: string;

  // ── SWOC: Opportunities to Improve (4 fields) ────────────────────
  /** What learned from bid/project */
  opportunities_lessonsLearned?: string;
  /** Action plan if Strength rating <8 */
  opportunities_actionPlan?: string;
  /** SOP/process suggestions */
  opportunities_sopSuggestions?: string;
  /** Price/Product trend analysis */
  opportunities_priceTrends?: string;

  // ── SWOC: Challenges Found (5 fields) ────────────────────────────
  /** Obstacles (subs availability, location, team, etc.) */
  challenges_obstacles?: string;
  /** Scope/knowledge-base challenges */
  challenges_scopeKnowledge?: string;
  /** Communication challenges */
  challenges_communication?: string;
  /** Price/Product that significantly increased bid */
  challenges_priceImpact?: string;
  /** Area needing focus before next bid/project */
  challenges_focusArea?: string;

  // ── Closing ──────────────────────────────────────────────────────
  /** General Notes/Details */
  generalNotes?: string;
  /** Overall Project Rate percentage (0–100) */
  overallPercentage?: number;
  /** Project Summary & Request for Changes to SOP */
  sopChangeRequests?: string;
  /** Overall rating 1–10 */
  overallRating: number;
  /** Auto-calculated: (yesCount / totalItems) * 100 */
  processScore: number;

  // ── Team ─────────────────────────────────────────────────────────
  /** Employees in Project — email addresses or display names */
  employees: string[];

  // ── Status ───────────────────────────────────────────────────────
  isFinalized: boolean;
  finalizedDate?: string;
  finalizedBy?: string;

  // ── Audit ────────────────────────────────────────────────────────
  CreatedBy: string;
  CreatedDate: string;
  ModifiedBy?: string;
  ModifiedDate?: string;
}

// ── Question Config ────────────────────────────────────────────────────

export interface IPostBidQuestionConfig {
  key: string;
  label: string;
  tooltip: string;
  /** Criteria rule text shown in the criteria column */
  criteriaNote?: string;
}

/**
 * 13 estimating process questions — single source of truth.
 * Maps 1:1 to Excel rows 5–17 of "Bid Project Analysis _Feedback".
 */
export const POST_BID_PROCESS_QUESTIONS: IPostBidQuestionConfig[] = [
  {
    key: 'realisticTimeline',
    label: 'Was the Bid Expectation Timeline Realistic? Did BD present proper complexity?',
    tooltip: 'Y/N — Describe Issue/Reason if No',
    criteriaNote: 'Y/N + Describe Issue/Reason',
  },
  {
    key: 'scopesBeforeProposals',
    label: 'Were scopes written before subs proposals?',
    tooltip: '15 or more days before proposals = Yes; less than 15 = No',
    criteriaNote: '>=15 days = Yes; <15 = No',
  },
  {
    key: 'threeBidsPerTrade',
    label: 'Ensured 3 bids per major trade?',
    tooltip: 'Were at least 3 bids obtained for each major trade?',
    criteriaNote: 'Y/N + weaknesses if No',
  },
  {
    key: 'reasonableITBTime',
    label: 'ITB sent with reasonable time for subs bidding?',
    tooltip: 'Was the Invitation to Bid timeframe reasonable for subcontractors?',
    criteriaNote: 'Y/N + weaknesses',
  },
  {
    key: 'bidsSavedProperly',
    label: 'All bids saved/submitted properly to project files?',
    tooltip: 'Were all bids saved and submitted correctly to the project filing system?',
    criteriaNote: 'Y/N + weaknesses',
  },
  {
    key: 'subsCommunicated',
    label: 'Subs communicated multiple times (email/phone) for goals & RFIs?',
    tooltip: 'Were subcontractors contacted multiple times via email and phone?',
    criteriaNote: 'Y/N + weaknesses',
  },
  {
    key: 'vettedProposals',
    label: 'All proposals vetted & Compass Qualified?',
    tooltip: 'Were all subcontractor proposals vetted using the Compass qualification system?',
    criteriaNote: 'Y/N + weaknesses',
  },
  {
    key: 'reasonableSpread',
    label: 'Reasonable spread between bidders?',
    tooltip: '5% or less spread between bidders = Yes; greater than 5% = No',
    criteriaNote: '<=5% = Yes; >5% = No',
  },
  {
    key: 'pricesMatchHistorical',
    label: 'Prices per SF correspond with historical data?',
    tooltip: 'If No, update historical pricing database',
    criteriaNote: 'Y/N + update historical if No',
  },
  {
    key: 'veOptionsOffered',
    label: 'VE options offered?',
    tooltip: 'Were Value Engineering options offered to the client?',
    criteriaNote: 'Y/N + weaknesses',
  },
  {
    key: 'deliverablesOnTime',
    label: 'All deliverables ready on time & using latest templates?',
    tooltip: 'Were all deliverables completed on time using the latest company templates?',
    criteriaNote: 'Y/N + challenges',
  },
  {
    key: 'estimate90Ready',
    label: 'Estimate 90% ready for Resubmission Review?',
    tooltip: 'Was the estimate at least 90% complete before the resubmission review?',
    criteriaNote: 'Y/N + weaknesses',
  },
  {
    key: 'metClientDeadline',
    label: "Met client's deadline?",
    tooltip: 'Was the client deadline met for bid submission?',
    criteriaNote: 'Y/N + weaknesses',
  },
];

// ── SWOC Prompt Config ─────────────────────────────────────────────────

export interface ISWOCPrompt {
  field: keyof IPostBidAutopsy;
  label: string;
}

export interface ISWOCSection {
  key: string;
  title: string;
  subtitle?: string;
  prompts: ISWOCPrompt[];
  /** Show confidentiality banner */
  confidential?: boolean;
}

export const SWOC_SECTIONS: ISWOCSection[] = [
  {
    key: 'strengths',
    title: 'Strengths',
    subtitle: 'Advantages and positive outcomes',
    prompts: [
      { field: 'strengths_advantages', label: 'What advantages did the team have within this project?' },
      { field: 'strengths_bestTurnout', label: 'What assisted best project turnout?' },
      { field: 'strengths_shareWithTeam', label: 'How should these strengths be shared with the broader team?' },
    ],
  },
  {
    key: 'weaknesses',
    title: 'Weaknesses',
    subtitle: 'Areas for improvement',
    prompts: [
      { field: 'weaknesses_resourcesLacking', label: 'What resources were lacking during the bid process?' },
      { field: 'weaknesses_areasToImprove', label: 'What areas need improvement for this and future projects?' },
      { field: 'weaknesses_mostChallenging', label: 'What was the most challenging area for the team?' },
      { field: 'weaknesses_missedScopes', label: 'Were there any missed or problematic scope elements?' },
    ],
  },
  {
    key: 'opportunities',
    title: 'Opportunities to Improve',
    subtitle: 'Open discussion',
    prompts: [
      { field: 'opportunities_lessonsLearned', label: 'What was learned from this bid/project?' },
      { field: 'opportunities_actionPlan', label: 'If the team Strength rating is below 8, what is the action plan?' },
      { field: 'opportunities_sopSuggestions', label: 'Are there SOP or process suggestions from this experience?' },
      { field: 'opportunities_priceTrends', label: 'Were there notable Price/Product trends to track?' },
    ],
  },
  {
    key: 'challenges',
    title: 'Challenges Found',
    subtitle: 'Open discussion',
    confidential: true,
    prompts: [
      { field: 'challenges_obstacles', label: 'What obstacles did the team face (subs availability, location, team, etc.)?' },
      { field: 'challenges_scopeKnowledge', label: 'Were there scope or knowledge-base challenges?' },
      { field: 'challenges_communication', label: 'Were there communication challenges?' },
      { field: 'challenges_priceImpact', label: 'Did any Price/Product significantly increase the bid?' },
      { field: 'challenges_focusArea', label: 'What area needs the most focus before the next bid/project?' },
    ],
  },
];
