import type { ILead, ILeadFormData, Stage, IPagedResult, IListQueryOptions } from '@hbc/models';
import type { ILeadRepository } from '../../ports/ILeadRepository';

const SEED_LEADS: ILead[] = [
  {
    id: 1, Title: 'Palm Beach County Convention Center', ClientName: 'Palm Beach County',
    Region: 'West Palm Beach' as ILead['Region'], Sector: 'County' as ILead['Sector'],
    Division: 'Commercial' as ILead['Division'], Originator: 'John Smith',
    DepartmentOfOrigin: 'Business Development' as ILead['DepartmentOfOrigin'],
    DateOfEvaluation: '2025-11-01', Stage: 'Opportunity' as Stage,
    ProjectValue: 45000000, AnticipatedFeePct: 3.5,
  },
  {
    id: 2, Title: 'Miami Airport Terminal Expansion', ClientName: 'Miami-Dade Aviation',
    Region: 'Miami' as ILead['Region'], Sector: 'Airport' as ILead['Sector'],
    Division: 'Commercial' as ILead['Division'], Originator: 'Jane Doe',
    DepartmentOfOrigin: 'Estimating' as ILead['DepartmentOfOrigin'],
    DateOfEvaluation: '2025-12-15', Stage: 'Pursuit' as Stage,
    ProjectValue: 120000000, AnticipatedFeePct: 2.8,
  },
  {
    id: 3, Title: 'Oceanfront Luxury Residences', ClientName: 'Coastal Living LLC',
    Region: 'Miami' as ILead['Region'], Sector: 'Multi-Family' as ILead['Sector'],
    Division: 'Luxury Residential' as ILead['Division'], Originator: 'Maria Garcia',
    DepartmentOfOrigin: 'Marketing' as ILead['DepartmentOfOrigin'],
    DateOfEvaluation: '2026-01-10', Stage: 'Lead-Discovery' as Stage,
    ProjectValue: 85000000, AnticipatedFeePct: 4.0,
  },
];

export class MockLeadRepository implements ILeadRepository {
  private leads: ILead[] = [...SEED_LEADS];
  private nextId = SEED_LEADS.length + 1;

  async getAll(options?: IListQueryOptions): Promise<IPagedResult<ILead>> {
    let items = [...this.leads];
    if (options?.orderBy) {
      items.sort((a, b) => {
        const key = options.orderBy as keyof ILead;
        const aVal = String(a[key] ?? '');
        const bVal = String(b[key] ?? '');
        return options.orderAscending === false ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });
    }
    const skip = options?.skip ?? 0;
    const top = options?.top ?? items.length;
    const paged = items.slice(skip, skip + top);
    return { items: paged, totalCount: items.length, hasMore: skip + top < items.length };
  }

  async getById(id: number): Promise<ILead | null> {
    return this.leads.find((l) => l.id === id) ?? null;
  }

  async getByStage(stage: Stage): Promise<ILead[]> {
    return this.leads.filter((l) => l.Stage === stage);
  }

  async create(data: ILeadFormData): Promise<ILead> {
    const lead: ILead = {
      ...data,
      id: this.nextId++,
      Originator: 'Current User',
      DateOfEvaluation: new Date().toISOString().split('T')[0],
    };
    this.leads.push(lead);
    return lead;
  }

  async update(id: number, data: Partial<ILead>): Promise<ILead> {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lead ${id} not found`);
    this.leads[idx] = { ...this.leads[idx], ...data };
    return this.leads[idx];
  }

  async delete(id: number): Promise<void> {
    this.leads = this.leads.filter((l) => l.id !== id);
  }

  async search(query: string): Promise<ILead[]> {
    const q = query.toLowerCase();
    return this.leads.filter(
      (l) =>
        l.Title.toLowerCase().includes(q) ||
        l.ClientName.toLowerCase().includes(q) ||
        l.Originator.toLowerCase().includes(q)
    );
  }
}
