import type { ITurnoverAgenda, ITurnoverPrerequisite, ITurnoverDiscussionItem, ITurnoverSubcontractor, ITurnoverExhibit, ITurnoverSignature, ITurnoverEstimateOverview, ITurnoverAttachment } from '@hbc/models';
import type { ITurnoverRepository } from '../../ports/ITurnoverRepository';

export class MockTurnoverRepository implements ITurnoverRepository {
  async getAgenda(_projectCode: string): Promise<ITurnoverAgenda | null> { return null; }
  async createAgenda(_projectCode: string, _leadId: number): Promise<ITurnoverAgenda> { throw new Error('Not implemented'); }
  async updateAgenda(_projectCode: string, _data: Partial<ITurnoverAgenda>): Promise<ITurnoverAgenda> { throw new Error('Not implemented'); }
  async updatePrerequisite(_prerequisiteId: number, _data: Partial<ITurnoverPrerequisite>): Promise<ITurnoverPrerequisite> { throw new Error('Not implemented'); }
  async updateDiscussionItem(_itemId: number, _data: Partial<ITurnoverDiscussionItem>): Promise<ITurnoverDiscussionItem> { throw new Error('Not implemented'); }
  async addDiscussionAttachment(_itemId: number, _file: File): Promise<ITurnoverAttachment> { throw new Error('Not implemented'); }
  async removeDiscussionAttachment(_attachmentId: number): Promise<void> {}
  async addSubcontractor(_turnoverAgendaId: number, _data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> { throw new Error('Not implemented'); }
  async updateSubcontractor(_subId: number, _data: Partial<ITurnoverSubcontractor>): Promise<ITurnoverSubcontractor> { throw new Error('Not implemented'); }
  async removeSubcontractor(_subId: number): Promise<void> {}
  async updateExhibit(_exhibitId: number, _data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> { throw new Error('Not implemented'); }
  async addExhibit(_turnoverAgendaId: number, _data: Partial<ITurnoverExhibit>): Promise<ITurnoverExhibit> { throw new Error('Not implemented'); }
  async removeExhibit(_exhibitId: number): Promise<void> {}
  async uploadExhibitFile(_exhibitId: number, _file: File): Promise<{ fileUrl: string; fileName: string }> { return { fileUrl: '/mock.pdf', fileName: 'mock.pdf' }; }
  async signAgenda(_signatureId: number, _comment?: string): Promise<ITurnoverSignature> { throw new Error('Not implemented'); }
  async updateEstimateOverview(_projectCode: string, _data: Partial<ITurnoverEstimateOverview>): Promise<ITurnoverEstimateOverview> { throw new Error('Not implemented'); }
}
