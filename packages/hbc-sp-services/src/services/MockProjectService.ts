import { IProjectService } from './IProjectService';
import { IProjectKpiSnapshot } from '../models/IProjectKpiSnapshot';

const MOCK_SNAPSHOTS: IProjectKpiSnapshot[] = [
  {
    projectCode: 'HBC-2024-001',
    projectName: 'Oceanview Tower',
    clientName: 'Oceanview Development LLC',
    currentContractValue: 45000000,
    percentComplete: 72,
    overallHealth: 'Green',
    lastActivityDate: '2026-02-20',
  },
  {
    projectCode: 'HBC-2024-002',
    projectName: 'Palm Gardens Residence',
    clientName: 'Palm Gardens HOA',
    currentContractValue: 18500000,
    percentComplete: 45,
    overallHealth: 'Yellow',
    lastActivityDate: '2026-02-19',
  },
  {
    projectCode: 'HBC-2024-003',
    projectName: 'Coral Ridge Medical Center',
    clientName: 'Coral Ridge Health',
    currentContractValue: 62000000,
    percentComplete: 15,
    overallHealth: 'Green',
    lastActivityDate: '2026-02-18',
  },
];

export class MockProjectService implements IProjectService {
  async getKpiSnapshot(projectCode: string): Promise<IProjectKpiSnapshot | undefined> {
    return MOCK_SNAPSHOTS.find(
      s => s.projectCode.toLowerCase() === projectCode.toLowerCase()
    );
  }

  async getKpiSnapshots(projectCodes: string[]): Promise<IProjectKpiSnapshot[]> {
    const codeSet = new Set(projectCodes.map(c => c.toLowerCase()));
    return MOCK_SNAPSHOTS.filter(s => codeSet.has(s.projectCode.toLowerCase()));
  }

  async getRecommendedProjects(
    _userEmail: string,
    _roles: string[],
    limit = 5
  ): Promise<IProjectKpiSnapshot[]> {
    return MOCK_SNAPSHOTS.slice(0, limit);
  }
}
