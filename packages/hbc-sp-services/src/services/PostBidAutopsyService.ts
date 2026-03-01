/**
 * Stage 21 — PostBidAutopsyService
 *
 * Template factory, score computation, and validation helpers for the
 * Post-Bid Autopsy feature. Consumed by MockDataService, SharePointDataService,
 * and UI components.
 *
 * 100% field coverage from reference/Estimating - Post Bid Autopsy.xlsx
 */
import {
  type IPostBidAutopsy,
  type IPostBidAutopsyItem,
  POST_BID_PROCESS_QUESTIONS,
} from '../models/IPostBidAutopsy';

export class PostBidAutopsyService {
  /**
   * Generate the default 13 estimating process question items from the
   * POST_BID_PROCESS_QUESTIONS config. Used by "Initialize from Template".
   */
  static createDefaultItems(autopsyId: number, startId = 1): IPostBidAutopsyItem[] {
    return POST_BID_PROCESS_QUESTIONS.map((q, idx) => ({
      id: startId + idx,
      autopsyId,
      questionKey: q.key,
      question: q.label,
      answer: null,
      criteria: q.criteriaNote,
      teamEvaluation: undefined,
      weaknessNotes: undefined,
      sortOrder: idx + 1,
      isCustom: false,
    }));
  }

  /**
   * Compute the process score as a percentage of "yes" answers.
   * Returns 0 when there are no items.
   */
  static computeProcessScore(items: IPostBidAutopsyItem[]): number {
    if (items.length === 0) return 0;
    const yesCount = items.filter(i => i.answer === 'yes').length;
    return Math.round((yesCount / items.length) * 100);
  }

  /**
   * Compute the completion percentage (items that have been answered).
   */
  static computeCompletion(items: IPostBidAutopsyItem[]): number {
    if (items.length === 0) return 0;
    const answeredCount = items.filter(i => i.answer !== null).length;
    return Math.round((answeredCount / items.length) * 100);
  }

  /**
   * Create a blank autopsy record with default items for a given project.
   */
  static createBlankAutopsy(
    id: number,
    projectCode: string,
    createdBy: string,
    leadId?: number,
  ): IPostBidAutopsy {
    const items = PostBidAutopsyService.createDefaultItems(id);
    return {
      id,
      ProjectCode: projectCode,
      LeadID: leadId,
      AnalysisDate: new Date().toISOString(),
      items,

      // SWOC — all blank
      strengths_advantages: undefined,
      strengths_bestTurnout: undefined,
      strengths_shareWithTeam: undefined,
      weaknesses_resourcesLacking: undefined,
      weaknesses_areasToImprove: undefined,
      weaknesses_mostChallenging: undefined,
      weaknesses_missedScopes: undefined,
      opportunities_lessonsLearned: undefined,
      opportunities_actionPlan: undefined,
      opportunities_sopSuggestions: undefined,
      opportunities_priceTrends: undefined,
      challenges_obstacles: undefined,
      challenges_scopeKnowledge: undefined,
      challenges_communication: undefined,
      challenges_priceImpact: undefined,
      challenges_focusArea: undefined,

      // Closing
      generalNotes: undefined,
      overallPercentage: undefined,
      sopChangeRequests: undefined,
      overallRating: 0,
      processScore: 0,

      // Team
      employees: [],

      // Status
      isFinalized: false,

      // Audit
      CreatedBy: createdBy,
      CreatedDate: new Date().toISOString(),
    };
  }

  /**
   * Validate that all required fields are populated before finalization.
   * Returns an array of validation error messages (empty = valid).
   */
  static validateForFinalization(autopsy: IPostBidAutopsy): string[] {
    const errors: string[] = [];

    const unanswered = autopsy.items.filter(i => i.answer === null);
    if (unanswered.length > 0) {
      errors.push(`${unanswered.length} estimating process question(s) have not been answered.`);
    }

    if (autopsy.overallRating < 1 || autopsy.overallRating > 10) {
      errors.push('Overall rating must be between 1 and 10.');
    }

    if (autopsy.employees.length === 0) {
      errors.push('At least one team member must be listed.');
    }

    return errors;
  }
}
