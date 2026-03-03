import type {
  ITurnoverAgenda,
  ITurnoverPrerequisite,
  ITurnoverDiscussionItem,
  ITurnoverSubcontractor,
  ITurnoverExhibit,
  ITurnoverSignature,
  ITurnoverEstimateOverview,
  ITurnoverAttachment,
} from '@hbc/models';

/**
 * Turnover agenda repository — prerequisites, discussion items, exhibits, signatures.
 */
export interface ITurnoverRepository {
  getAgenda(projectCode: string): Promise<ITurnoverAgenda | null>;
  createAgenda(projectCode: string, leadId: number): Promise<ITurnoverAgenda>;
  updateAgenda(projectCode: string, data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda>;

  // Prerequisites
  updatePrerequisite(prerequisiteId: number, data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite>;

  // Discussion Items
  updateDiscussionItem(itemId: number, data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem>;
  addDiscussionAttachment(itemId: number, file: File): Promise<ITurnoverAttachment>;
  removeDiscussionAttachment(attachmentId: number): Promise<void>;

  // Subcontractors
  addSubcontractor(turnoverAgendaId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor>;
  updateSubcontractor(subId: number, data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor>;
  removeSubcontractor(subId: number): Promise<void>;

  // Exhibits
  updateExhibit(exhibitId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit>;
  addExhibit(turnoverAgendaId: number, data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit>;
  removeExhibit(exhibitId: number): Promise<void>;
  uploadExhibitFile(exhibitId: number, file: File): Promise<{ fileUrl: string; fileName: string }>;

  // Signatures
  signAgenda(signatureId: number, comment?: string): Promise<ITurnoverSignature>;

  // Estimate Overview
  updateEstimateOverview(projectCode: string, data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview>;
}
